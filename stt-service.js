/**
 * STT 服务 - 基于 Web Speech API
 * 参考：https://blog.csdn.net/YN2000609/article/details/142390282
 */

class STTService {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.init();
    }

    init() {
        // 检查浏览器支持
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            console.error('❌ 当前浏览器不支持 Web Speech API');
            this.showNotSupported();
            return;
        }

        this.recognition = new SpeechRecognition();
        this.setupRecognition();
    }

    setupRecognition() {
        // 配置识别参数
        this.recognition.continuous = false; // 非连续识别
        this.recognition.interimResults = true; // 显示临时结果
        this.recognition.maxAlternatives = 1; // 只取最佳结果

        // 语言设置
        this.recognition.lang = 'zh-CN';

        // 事件处理
        this.recognition.onstart = () => {
            this.isListening = true;
        };

        this.recognition.onend = () => {
            this.isListening = false;
        };

        this.recognition.onresult = (event) => {
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                transcript += event.results[i][0].transcript;
            }
            this.handleResult(transcript);
        };

        this.recognition.onerror = (event) => {
            console.error('❌ 识别错误:', event.error);
            this.handleError(event.error);
        };
    }

    /**
     * 处理识别结果
     */
    handleResult(transcript) {
        const output = document.getElementById('stt-output');
        if (output) {
            output.value = transcript;
        }
    }

    /**
     * 处理错误
     */
    handleError(error) {
        const status = document.getElementById('recording-status');
        if (status) {
            status.innerHTML = `<p>⚠️ 识别错误：${error}</p>`;
            status.style.background = '#fee2e2';
        }

        // 停止录音状态
        this.stopListening();
    }

    /**
     * 显示不支持提示
     */
    showNotSupported() {
        const sttPanel = document.getElementById('stt-panel');
        if (sttPanel) {
            sttPanel.innerHTML = `
                <div class="card">
                    <div class="stt-info">
                        <p>⚠️ 您的浏览器不支持语音识别功能，建议使用 <strong>Chrome</strong> 或 <strong>Edge</strong> 浏览器。</p>
                    </div>
                </div>
            `;
        }
    }

    /**
     * 开始录音
     */
    startListening() {
        if (this.isListening) return;

        try {
            this.recognition.start();
            this.updateUI(true);
        } catch (error) {
            console.error('❌ 开始录音失败:', error);
        }
    }

    /**
     * 停止录音
     */
    stopListening() {
        if (!this.isListening) return;

        try {
            this.recognition.stop();
            this.updateUI(false);
        } catch (error) {
            console.error('❌ 停止录音失败:', error);
        }
    }

    /**
     * 更新 UI 状态
     */
    updateUI(isListening) {
        const startBtn = document.getElementById('stt-start');
        const stopBtn = document.getElementById('stt-stop');
        const status = document.getElementById('recording-status');

        if (startBtn) startBtn.disabled = isListening;
        if (stopBtn) stopBtn.disabled = !isListening;
        if (status) status.style.display = isListening ? 'block' : 'none';
    }

    /**
     * 设置识别语言
     */
    setLanguage(lang) {
        if (this.recognition) {
            this.recognition.lang = lang;
        }
    }

    /**
     * 获取当前识别状态
     */
    getIsListening() {
        return this.isListening;
    }
}

// 创建全局实例
const sttService = new STTService();
