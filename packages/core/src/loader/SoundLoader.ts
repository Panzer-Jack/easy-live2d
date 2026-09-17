/**
 * 音频加载器
 * 负责通用音频解码、PCM 数据提取和 RMS 计算（用于唇形同步）
 * 从原 SoundManager 拆分
 */
export class SoundLoader {
  private _pcmData: Float32Array[] | null = null
  private _sampleOffset = 0
  private _userTimeSeconds = 0
  private _lastRms = 0
  private _audioFileInfo = new AudioFileInfo()
  private _loadVersion = 0
  private _loadAbort: AbortController | null = null
  private static _audioContext: AudioContext | null = null

  update(deltaTimeSeconds: number): boolean {
    if (
      this._pcmData === null
      || this._sampleOffset >= this._audioFileInfo.samplesPerChannel
    ) {
      this._lastRms = 0.0
      return false
    }

    this._userTimeSeconds += deltaTimeSeconds
    let goalOffset = Math.floor(
      this._userTimeSeconds * this._audioFileInfo.samplingRate,
    )
    if (goalOffset > this._audioFileInfo.samplesPerChannel) {
      goalOffset = this._audioFileInfo.samplesPerChannel
    }

    if (goalOffset <= this._sampleOffset) {
      this._lastRms = 0.0
      return true
    }

    let rms = 0.0
    for (let ch = 0; ch < this._audioFileInfo.numberOfChannels; ch++) {
      for (let s = this._sampleOffset; s < goalOffset; s++) {
        const pcm = this._pcmData[ch][s]
        rms += pcm * pcm
      }
    }
    rms = Math.sqrt(
      rms / (this._audioFileInfo.numberOfChannels * (goalOffset - this._sampleOffset)),
    )

    this._lastRms = rms
    this._sampleOffset = goalOffset
    return true
  }

  getRms(): number {
    return this._lastRms
  }

  async start(filePath: string): Promise<AudioBuffer | null> {
    this.releasePcmData()
    this._loadAbort = new AbortController()
    return this.loadAudioFile(filePath, this._loadVersion, this._loadAbort.signal)
  }

  private async loadAudioFile(filePath: string, loadVersion: number, signal: AbortSignal): Promise<AudioBuffer | null> {
    try {
      const response = await fetch(filePath, { signal })
      if (!response.ok) {
        throw new Error(`Failed to fetch audio file: ${response.status} ${response.statusText}`)
      }

      const arrayBuffer = await response.arrayBuffer()
      const audioBuffer = await SoundLoader.getAudioContext().decodeAudioData(arrayBuffer)

      if (loadVersion !== this._loadVersion) {
        return null
      }

      this._audioFileInfo.numberOfChannels = audioBuffer.numberOfChannels
      this._audioFileInfo.samplingRate = audioBuffer.sampleRate
      this._audioFileInfo.samplesPerChannel = audioBuffer.length
      this._pcmData = Array.from(
        { length: audioBuffer.numberOfChannels },
        (_, channel) => audioBuffer.getChannelData(channel),
      )
      return audioBuffer
    } catch (error) {
      if (loadVersion === this._loadVersion) {
        this.resetState()
        console.error(`Failed to decode audio file: ${filePath}`, error)
      }
      return null
    }
  }

  releasePcmData(): void {
    this._loadVersion++
    this._loadAbort?.abort()
    this._loadAbort = null
    this.resetState()
  }

  private resetState(): void {
    this._pcmData = null
    this._sampleOffset = 0
    this._userTimeSeconds = 0
    this._lastRms = 0
    this._audioFileInfo.reset()
  }

  private static getAudioContext(): AudioContext {
    if (this._audioContext) {
      return this._audioContext
    }

    const AudioContextCtor = (
      globalThis as typeof globalThis & { webkitAudioContext?: typeof AudioContext }
    ).AudioContext ?? (
      globalThis as typeof globalThis & { webkitAudioContext?: typeof AudioContext }
    ).webkitAudioContext

    if (!AudioContextCtor) {
      throw new Error('Web Audio API is not supported in the current environment.')
    }

    this._audioContext = new AudioContextCtor()
    return this._audioContext
  }
}

class AudioFileInfo {
  numberOfChannels = 0
  samplingRate = 0
  samplesPerChannel = 0

  reset(): void {
    this.numberOfChannels = 0
    this.samplingRate = 0
    this.samplesPerChannel = 0
  }
}
