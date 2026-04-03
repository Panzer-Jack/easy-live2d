/**
 * WAV 音频加载器
 * 负责 WAV 文件解析、PCM 数据提取和 RMS 计算（用于唇形同步）
 * 从原 SoundManager 拆分
 */
export class SoundLoader {
  private _pcmData: Float32Array[] | null = null
  private _sampleOffset = 0
  private _userTimeSeconds = 0
  private _lastRms = 0
  private _wavFileInfo = new WavFileInfo()

  update(deltaTimeSeconds: number): boolean {
    if (
      this._pcmData === null
      || this._sampleOffset >= this._wavFileInfo.samplesPerChannel
    ) {
      this._lastRms = 0.0
      return false
    }

    this._userTimeSeconds += deltaTimeSeconds
    let goalOffset = Math.floor(
      this._userTimeSeconds * this._wavFileInfo.samplingRate,
    )
    if (goalOffset > this._wavFileInfo.samplesPerChannel) {
      goalOffset = this._wavFileInfo.samplesPerChannel
    }

    let rms = 0.0
    for (let ch = 0; ch < this._wavFileInfo.numberOfChannels; ch++) {
      for (let s = this._sampleOffset; s < goalOffset; s++) {
        const pcm = this._pcmData[ch][s]
        rms += pcm * pcm
      }
    }
    rms = Math.sqrt(
      rms / (this._wavFileInfo.numberOfChannels * (goalOffset - this._sampleOffset)),
    )

    this._lastRms = rms
    this._sampleOffset = goalOffset
    return true
  }

  start(filePath: string): void {
    this._sampleOffset = 0
    this._userTimeSeconds = 0.0
    this._lastRms = 0.0
    this.loadWavFile(filePath)
  }

  getRms(): number {
    return this._lastRms
  }

  async loadWavFile(filePath: string): Promise<boolean> {
    if (this._pcmData != null) {
      this.releasePcmData()
    }

    const response = await fetch(filePath)
    const arrayBuffer = await response.arrayBuffer()
    const reader = new ByteReader(arrayBuffer)

    if (!reader.getCheckSignature('RIFF'))
      return false
    reader.get32LittleEndian()
    if (!reader.getCheckSignature('WAVE'))
      return false
    if (!reader.getCheckSignature('fmt '))
      return false

    const fmtChunkSize = reader.get32LittleEndian()
    if (fmtChunkSize < 16)
      return false

    const formatTag = reader.get16LittleEndian()
    this._wavFileInfo.numberOfChannels = reader.get16LittleEndian()
    this._wavFileInfo.samplingRate = reader.get32LittleEndian()
    reader.get32LittleEndian() // avgBytesPerSec
    reader.get16LittleEndian() // blockAlign
    this._wavFileInfo.bitsPerSample = reader.get16LittleEndian()

    if (fmtChunkSize > 16)
      reader.skip(fmtChunkSize - 16)
    if (formatTag !== 1)
      return false // PCM only

    // 查找 data chunk
    while (!reader.getCheckSignature('data')) {
      const skipSize = reader.get32LittleEndian()
      reader.skip(skipSize)
      if (reader.isEof())
        return false
    }

    const dataChunkSize = reader.get32LittleEndian()
    this._wavFileInfo.samplesPerChannel
      = (dataChunkSize * 8) / (this._wavFileInfo.bitsPerSample * this._wavFileInfo.numberOfChannels)

    this._pcmData = Array.from(
      { length: this._wavFileInfo.numberOfChannels },
      () => new Float32Array(this._wavFileInfo.samplesPerChannel),
    )

    const bps = this._wavFileInfo.bitsPerSample
    for (let s = 0; s < this._wavFileInfo.samplesPerChannel; s++) {
      for (let ch = 0; ch < this._wavFileInfo.numberOfChannels; ch++) {
        this._pcmData[ch][s] = this.getPcmSample(reader, bps)
      }
    }

    return true
  }

  private getPcmSample(reader: ByteReader, bitsPerSample: number): number {
    switch (bitsPerSample) {
      case 8: return (reader.get8() - 128) / 128.0
      case 16: return reader.get16LittleEndian() / 32768.0
      case 24: return (reader.get24LittleEndian() << 8) / 2147483648.0
      default: return 0
    }
  }

  releasePcmData(): void {
    this._pcmData = null
    this._sampleOffset = 0
    this._userTimeSeconds = 0
    this._lastRms = 0
  }
}

class WavFileInfo {
  numberOfChannels = 0
  bitsPerSample = 0
  samplingRate = 0
  samplesPerChannel = 0
}

class ByteReader {
  private _dataView: DataView
  private _offset = 0
  private _size: number

  constructor(buffer: ArrayBuffer) {
    this._dataView = new DataView(buffer)
    this._size = buffer.byteLength
  }

  isEof(): boolean {
    return this._offset >= this._size
  }

  get8(): number {
    const ret = this._dataView.getUint8(this._offset)
    this._offset += 1
    return ret
  }

  get16LittleEndian(): number {
    const ret
      = (this._dataView.getUint8(this._offset + 1) << 8)
        | this._dataView.getUint8(this._offset)
    this._offset += 2
    return ret
  }

  get24LittleEndian(): number {
    const ret
      = (this._dataView.getUint8(this._offset + 2) << 16)
        | (this._dataView.getUint8(this._offset + 1) << 8)
        | this._dataView.getUint8(this._offset)
    this._offset += 3
    return ret
  }

  get32LittleEndian(): number {
    const ret
      = (this._dataView.getUint8(this._offset + 3) << 24)
        | (this._dataView.getUint8(this._offset + 2) << 16)
        | (this._dataView.getUint8(this._offset + 1) << 8)
        | this._dataView.getUint8(this._offset)
    this._offset += 4
    return ret
  }

  getCheckSignature(reference: string): boolean {
    const refBytes = new TextEncoder().encode(reference)
    if (reference.length !== 4)
      return false
    for (let i = 0; i < 4; i++) {
      if (this.get8() !== refBytes[i])
        return false
    }
    return true
  }

  skip(count: number): void {
    this._offset += count
  }
}
