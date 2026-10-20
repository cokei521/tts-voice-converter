/**
 * TTS 服务 - 基于 Microsoft Edge TTS
 * 参考：https://blog.csdn.net/gitblog_01008/article/details/156296694
 */

class TTSService {
    constructor() {
        this.voices = [];
        this.currentUtterance = null;
        this.isSpeaking = false;
        this.init();
    }

    async init() {
        await this.loadVoices();
    }

    /**
     * 加载可用语音列表
     */
    async loadVoices() {
        try {
            // 使用 Edge TTS 的公开 API 获取语音列表
            const response = await fetch('https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/voices/list');
            const voices = await response.json();
            
            this.voices = voices.filter(v => v.IsReady);
            this.populateVoiceSelect();
            console.log('✅ 语音列表加载成功，共', this.voices.length, '个语音');
        } catch (error) {
            console.error('❌ 加载语音列表失败:', error);
            this.populateVoiceSelectFallback();
        }
    }

    /**
     * 填充语音选择框
     */
    populateVoiceSelect() {
        const select = document.getElementById('voice-select');
        select.innerHTML = '';

        // 按语言分组
        const groupedVoices = this.groupVoicesByLanguage(this.voices);

        for (const [lang, voiceList] of Object.entries(groupedVoices)) {
            const optgroup = document.createElement('optgroup');
            optgroup.label = lang;
            
            voiceList.forEach(voice => {
                const option = document.createElement('option');
                option.value = voice.ShortName;
                option.textContent = `${voice.DisplayName} (${voice.Gender})`;
                optgroup.appendChild(option);
            });

            select.appendChild(optgroup);
        }

        // 默认选择第一个中文语音
        const defaultVoice = this.voices.find(v => v.ShortName.startsWith('zh-CN'))?.ShortName;
        if (defaultVoice) {
            select.value = defaultVoice;
        }
    }

    /**
     * 回退方案：使用浏览器内置语音
     */
    populateVoiceSelectFallback() {
        const select = document.getElementById('voice-select');
        select.innerHTML = '';

        if ('speechSynthesis' in window) {
            const voices = window.speechSynthesis.getVoices();
            voices.forEach(voice => {
                const option = document.createElement('option');
                option.value = voice.name;
                option.textContent = `${voice.name} (${voice.lang})`;
                select.appendChild(option);
            });
        }
    }

    /**
     * 按语言分组语音
     */
    groupVoicesByLanguage(voices) {
        return voices.reduce((groups, voice) => {
            const lang = voice.Language.split('-')[0] + '-' + voice.Language.split('-')[1];
            if (!groups[lang]) groups[lang] = [];
            groups[lang].push(voice);
            return groups;
        }, {});
    }

    /**
     * 生成语音 (使用 Edge TTS)
     */
    async generateTTS(text, voice, speed = 1, pitch = 1) {
        try {
            const response = await fetch('https://api-edge.speech.microsoft.com/cognitiveservices/v1', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Microsoft-OutputFormat': 'raw-16khz-16bit-mono-mono',
                },
                body: JSON.stringify({
                    text: text,
                    voice: voice,
                    prosody: {
                        rate: `${speed}%`,
                        pitch: `${pitch * 100}%`
                    }
                })
            });

            if (!response.ok) throw new Error('TTS 生成失败');

            const blob = await response.blob();
            return blob;
        } catch (error) {
            console.error('❌ TTS 生成失败，使用回退方案:', error);
            return this.fallbackTTS(text, voice, speed, pitch);
        }
    }

    /**
     * 回退 TTS 方案：使用 Web Speech API
     */
    fallbackTTS(text, voiceName, speed, pitch) {
        return new Promise((resolve) => {
            const utterance = new SpeechSynthesisUtterance(text);
            
            if (voiceName) {
                const voices = window.speechSynthesis.getVoices();
                const selectedVoice = voices.find(v => v.name === voiceName);
                if (selectedVoice) utterance.voice = selectedVoice;
            }

            utterance.rate = speed;
            utterance.pitch = pitch;

            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const analyser = audioContext.createAnalyser();
            const source = audioContext.createMediaStreamSource(new MediaStream([]));
            
            // 简单回退：直接播放
            window.speechSynthesis.speak(utterance);
            
            // 创建一个空的 blob 用于下载提示
            const emptyBlob = new Blob([], { type: 'audio/mpeg' });
            resolve(emptyBlob);
        });
    }

    /**
     * 播放语音
     */
    play(text, voice, speed = 1, pitch = 1) {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel(); // 停止当前播放

            const utterance = new SpeechSynthesisUtterance(text);
            
            if (voice) {
                const voices = window.speechSynthesis.getVoices();
                const selectedVoice = voices.find(v => v.name === voice);
                if (selectedVoice) utterance.voice = selectedVoice;
            }

            utterance.rate = speed;
            utterance.pitch = pitch;

            utterance.onstart = () => {
                this.isSpeaking = true;
            };

            utterance.onend = () => {
                this.isSpeaking = false;
            };

            window.speechSynthesis.speak(utterance);
            this.currentUtterance = utterance;
        }
    }

    /**
     * 停止播放
     */
    stop() {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            this.isSpeaking = false;
        }
    }

    /**
     * 检查是否正在播放
     */
    isCurrentlySpeaking() {
        return this.isSpeaking;
    }
}

// 创建全局实例
const ttsService = new TTSService();