/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * 使用此源代码受Live2D开源软件许可证的约束，
 * 该许可证可在https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html找到。
 */

/** @deprecated 随着getInstance()被弃用，此变量也已被弃用。 */
export let s_instance: LAppWavFileHandler = null;

export class LAppWavFileHandler {
  /**
   * 返回类的实例（单例）。
   * 如果实例尚未创建，则在内部创建实例。
   *
   * @return 类的实例
   * @deprecated 此类中单例模式的使用已被弃用。请改用 new LAppWavFileHandler()。
   */
  public static getInstance(): LAppWavFileHandler {
    if (s_instance == null) {
      s_instance = new LAppWavFileHandler();
    }

    return s_instance;
  }

  /**
   * 释放类的实例（单例）。
   *
   * @deprecated 随着getInstance()被弃用，此函数也已被弃用。
   */
  public static releaseInstance(): void {
    if (s_instance != null) {
      s_instance = void 0;
    }

    s_instance = null;
  }

  public update(deltaTimeSeconds: number) {
    let goalOffset: number;
    let rms: number;

    // 数据加载前/到达文件末尾时不更新
    if (
      this._pcmData == null ||
      this._sampleOffset >= this._wavFileInfo._samplesPerChannel
    ) {
      this._lastRms = 0.0;
      return false;
    }

    // 保存经过时间后的状态
    this._userTimeSeconds += deltaTimeSeconds;
    goalOffset = Math.floor(
      this._userTimeSeconds * this._wavFileInfo._samplingRate
    );
    if (goalOffset > this._wavFileInfo._samplesPerChannel) {
      goalOffset = this._wavFileInfo._samplesPerChannel;
    }

    // RMS测量
    rms = 0.0;
    for (
      let channelCount = 0;
      channelCount < this._wavFileInfo._numberOfChannels;
      channelCount++
    ) {
      for (
        let sampleCount = this._sampleOffset;
        sampleCount < goalOffset;
        sampleCount++
      ) {
        const pcm = this._pcmData[channelCount][sampleCount];
        rms += pcm * pcm;
      }
    }
    rms = Math.sqrt(
      rms /
        (this._wavFileInfo._numberOfChannels *
          (goalOffset - this._sampleOffset))
    );

    this._lastRms = rms;
    this._sampleOffset = goalOffset;
    return true;
  }

  public start(filePath: string): void {
    // 初始化样本引用位置
    this._sampleOffset = 0;
    this._userTimeSeconds = 0.0;

    // 重置RMS值
    this._lastRms = 0.0;

    this.loadWavFile(filePath);
  }

  public getRms(): number {
    return this._lastRms;
  }

  public loadWavFile(filePath: string): Promise<boolean> {
    return new Promise(resolveValue => {
      let ret = false;

      if (this._pcmData != null) {
        this.releasePcmData();
      }

      // 文件加载
      const asyncFileLoad = async () => {
        return fetch(filePath).then(responce => {
          return responce.arrayBuffer();
        });
      };

      const asyncWavFileManager = (async () => {
        this._byteReader._fileByte = await asyncFileLoad();
        this._byteReader._fileDataView = new DataView(
          this._byteReader._fileByte
        );
        this._byteReader._fileSize = this._byteReader._fileByte.byteLength;
        this._byteReader._readOffset = 0;

        // 如果文件加载失败，或者文件大小小到连首部的"RIFF"签名都放不下，则失败
        if (
          this._byteReader._fileByte == null ||
          this._byteReader._fileSize < 4
        ) {
          resolveValue(false);
          return;
        }

        // 文件名
        this._wavFileInfo._fileName = filePath;

        try {
          // 签名 "RIFF"
          if (!this._byteReader.getCheckSignature('RIFF')) {
            ret = false;
            throw new Error('无法找到签名 "RIFF"。');
          }
          // 文件大小-8（跳过）
          this._byteReader.get32LittleEndian();
          // 签名 "WAVE"
          if (!this._byteReader.getCheckSignature('WAVE')) {
            ret = false;
            throw new Error('无法找到签名 "WAVE"。');
          }
          // 签名 "fmt "
          if (!this._byteReader.getCheckSignature('fmt ')) {
            ret = false;
            throw new Error('无法找到签名 "fmt"。');
          }
          // fmt块大小
          const fmtChunkSize = this._byteReader.get32LittleEndian();
          // 只接受格式ID为1（线性PCM）的格式
          if (this._byteReader.get16LittleEndian() != 1) {
            ret = false;
            throw new Error('文件不是线性PCM格式。');
          }
          // 通道数
          this._wavFileInfo._numberOfChannels =
            this._byteReader.get16LittleEndian();
          // 采样率
          this._wavFileInfo._samplingRate =
            this._byteReader.get32LittleEndian();
          // 数据速率[byte/sec]（跳过）
          this._byteReader.get32LittleEndian();
          // 块大小（跳过）
          this._byteReader.get16LittleEndian();
          // 量化位数
          this._wavFileInfo._bitsPerSample =
            this._byteReader.get16LittleEndian();
          // 跳过fmt块的扩展部分
          if (fmtChunkSize > 16) {
            this._byteReader._readOffset += fmtChunkSize - 16;
          }
          // 跳过直到出现"data"块
          while (
            !this._byteReader.getCheckSignature('data') &&
            this._byteReader._readOffset < this._byteReader._fileSize
          ) {
            this._byteReader._readOffset +=
              this._byteReader.get32LittleEndian() + 4;
          }
          // 文件中未出现"data"块
          if (this._byteReader._readOffset >= this._byteReader._fileSize) {
            ret = false;
            throw new Error('无法找到 "data" 块。');
          }
          // 样本数
          {
            const dataChunkSize = this._byteReader.get32LittleEndian();
            this._wavFileInfo._samplesPerChannel =
              (dataChunkSize * 8) /
              (this._wavFileInfo._bitsPerSample *
                this._wavFileInfo._numberOfChannels);
          }
          // 分配内存
          this._pcmData = new Array(this._wavFileInfo._numberOfChannels);
          for (
            let channelCount = 0;
            channelCount < this._wavFileInfo._numberOfChannels;
            channelCount++
          ) {
            this._pcmData[channelCount] = new Float32Array(
              this._wavFileInfo._samplesPerChannel
            );
          }
          // 获取波形数据
          for (
            let sampleCount = 0;
            sampleCount < this._wavFileInfo._samplesPerChannel;
            sampleCount++
          ) {
            for (
              let channelCount = 0;
              channelCount < this._wavFileInfo._numberOfChannels;
              channelCount++
            ) {
              this._pcmData[channelCount][sampleCount] = this.getPcmSample();
            }
          }

          ret = true;

          resolveValue(ret);
        } catch (e) {
          console.log(e);
        }
      })().then(() => {
        resolveValue(ret);
      });
    });
  }

  public getPcmSample(): number {
    let pcm32;

    // 扩展为32位宽，然后四舍五入到-1～1范围
    switch (this._wavFileInfo._bitsPerSample) {
      case 8:
        pcm32 = this._byteReader.get8() - 128;
        pcm32 <<= 24;
        break;
      case 16:
        pcm32 = this._byteReader.get16LittleEndian() << 16;
        break;
      case 24:
        pcm32 = this._byteReader.get24LittleEndian() << 8;
        break;
      default:
        // 不支持的位宽
        pcm32 = 0;
        break;
    }

    return pcm32 / 2147483647; //Number.MAX_VALUE;
  }

  /**
   * 从指定通道获取音频样本数组
   *
   * @param usechannel 要使用的通道
   * @returns 指定通道的音频样本数组
   */
  public getPcmDataChannel(usechannel: number): Float32Array {
    // 如果指定的通道数超过数据数组长度，则返回null
    if (!this._pcmData || !(usechannel < this._pcmData.length)) {
      return null;
    }

    // 从_pcmData中创建新的指定通道的Float32Array
    return Float32Array.from(this._pcmData[usechannel]);
  }

  /**
   * 获取音频的采样率
   *
   * @returns 音频采样率
   */
  public getWavSamplingRate(): number {
    if (!this._wavFileInfo || this._wavFileInfo._samplingRate < 1) {
      return null;
    }

    return this._wavFileInfo._samplingRate;
  }

  public releasePcmData(): void {
    for (
      let channelCount = 0;
      channelCount < this._wavFileInfo._numberOfChannels;
      channelCount++
    ) {
      this._pcmData[channelCount] = null;
    }
    delete this._pcmData;
    this._pcmData = null;
  }

  constructor() {
    this._pcmData = null;
    this._userTimeSeconds = 0.0;
    this._lastRms = 0.0;
    this._sampleOffset = 0.0;
    this._wavFileInfo = new WavFileInfo();
    this._byteReader = new ByteReader();
  }

  _pcmData: Array<Float32Array>;
  _userTimeSeconds: number;
  _lastRms: number;
  _sampleOffset: number;
  _wavFileInfo: WavFileInfo;
  _byteReader: ByteReader;
  loadFiletoBytes = (arrayBuffer: ArrayBuffer, length: number): void => {
    this._byteReader._fileByte = arrayBuffer;
    this._byteReader._fileDataView = new DataView(this._byteReader._fileByte);
    this._byteReader._fileSize = length;
  };
}

export class WavFileInfo {
  constructor() {
    this._fileName = '';
    this._numberOfChannels = 0;
    this._bitsPerSample = 0;
    this._samplingRate = 0;
    this._samplesPerChannel = 0;
  }

  _fileName: string; ///< 文件名
  _numberOfChannels: number; ///< 通道数
  _bitsPerSample: number; ///< 每样本位数
  _samplingRate: number; ///< 采样率
  _samplesPerChannel: number; ///< 每通道总样本数
}

export class ByteReader {
  constructor() {
    this._fileByte = null;
    this._fileDataView = null;
    this._fileSize = 0;
    this._readOffset = 0;
  }

  /**
   * @brief 8位读取
   * @return Csm::csmUint8 读取的8位值
   */
  public get8(): number {
    const ret = this._fileDataView.getUint8(this._readOffset);
    this._readOffset++;
    return ret;
  }

  /**
   * @brief 16位读取（小端序）
   * @return Csm::csmUint16 读取的16位值
   */
  public get16LittleEndian(): number {
    const ret =
      (this._fileDataView.getUint8(this._readOffset + 1) << 8) |
      this._fileDataView.getUint8(this._readOffset);
    this._readOffset += 2;
    return ret;
  }

  /**
   * @brief 24位读取（小端序）
   * @return Csm::csmUint32 读取的24位值（设置在低24位）
   */
  public get24LittleEndian(): number {
    const ret =
      (this._fileDataView.getUint8(this._readOffset + 2) << 16) |
      (this._fileDataView.getUint8(this._readOffset + 1) << 8) |
      this._fileDataView.getUint8(this._readOffset);
    this._readOffset += 3;
    return ret;
  }

  /**
   * @brief 32位读取（小端序）
   * @return Csm::csmUint32 读取的32位值
   */
  public get32LittleEndian(): number {
    const ret =
      (this._fileDataView.getUint8(this._readOffset + 3) << 24) |
      (this._fileDataView.getUint8(this._readOffset + 2) << 16) |
      (this._fileDataView.getUint8(this._readOffset + 1) << 8) |
      this._fileDataView.getUint8(this._readOffset);
    this._readOffset += 4;
    return ret;
  }

  /**
   * @brief 获取签名并检查与参考字符串是否匹配
   * @param[in] reference 检查目标的签名字符串
   * @retval  true    匹配
   * @retval  false   不匹配
   */
  public getCheckSignature(reference: string): boolean {
    const getSignature: Uint8Array = new Uint8Array(4);
    const referenceString: Uint8Array = new TextEncoder().encode(reference);
    if (reference.length != 4) {
      return false;
    }
    for (let signatureOffset = 0; signatureOffset < 4; signatureOffset++) {
      getSignature[signatureOffset] = this.get8();
    }
    return (
      getSignature[0] == referenceString[0] &&
      getSignature[1] == referenceString[1] &&
      getSignature[2] == referenceString[2] &&
      getSignature[3] == referenceString[3]
    );
  }

  _fileByte: ArrayBuffer; ///< 加载的文件字节序列
  _fileDataView: DataView;
  _fileSize: number; ///< 文件大小
  _readOffset: number; ///< 文件引用位置
}
