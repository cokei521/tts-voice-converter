/**
 * 主应用逻辑
 * 整合 TTS 和 STT 功能，提供完整的语音转换体验
 */

document.addEventListener('DOMContentLoaded', () => {
    // 初始化
    initModeSwitch();
    initTTS();
    initSTT();
    initCharacterCount();
    initCodeCopy();
});

/**
 * 模式切换
 */
function initModeSwitch() {
    const modeBtns = document.querySelectorAll('.mode-btn');
    const modePanels = document.querySelectorAll('.mode-panel');

    modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const mode = btn.dataset.mode;

            // 更新按钮状态
            modeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // 更新面板显示
            modePanels.forEach(panel => {
                panel.classList.remove('active');
                if (panel.id === `${mode}-panel`) {
                    panel.classList.add('active');
                }
            });

            // 切换语言设置
            if (mode === 'stt') {
                const lang = document.getElementById('language-select').value;
                sttService.setLanguage(lang);
            }
        });
    });
}

/**
 * 代码块复制功能
 */
function initCodeCopy() {
    const copyBtns = document.querySelectorAll('.copy-btn');

    copyBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.dataset.target;
            const codeBlock = document.querySelector(`pre[data-target="${targetId}"] code`) || 
                            document.querySelector(`.code-block [data-target="${targetId}"] code`);
            
            if (codeBlock) {
                const text = codeBlock.textContent;
                navigator.clipboard.writeText(text).then(() => {
                    const originalText = btn.textContent;
                    btn.textContent = '✅ 已复制';
                    setTimeout(() => {
                        btn.textContent = originalText;
                    }, 2000);
                }).catch(err => {
                    console.error('复制失败:', err);
                    alert('复制失败，请手动复制');
                });
            }
        });
    });
}

/**
 * TTS 功能初始化
 */
function initTTS() {
    const ttsInput = document.getElementById('tts-input');
    const voiceSelect = document.getElementById('voice-select');
    const speedRange = document.getElementById('speed-range');
    const pitchRange = document.getElementById('pitch-range');
    const speedValue = document.getElementById('speed-value');
    const pitchValue = document.getElementById('pitch-value');
    const languageSelect = document.getElementById('language-select');
    
    const generateBtn = document.getElementById('tts-generate');
    const playBtn = document.getElementById('tts-play');
    const stopBtn = document.getElementById('tts-stop');
    const downloadBtn = document.getElementById('tts-download');

    // 语速/音调更新
    speedRange.addEventListener('input', () => {
        speedValue.textContent = `${speedRange.value}x`;
    });

    pitchRange.addEventListener('input', () => {
        pitchValue.textContent = pitchRange.value;
    });

    // 语言切换
    languageSelect.addEventListener('change', () => {
        sttService.setLanguage(languageSelect.value);
    });

    // 生成语音
    generateBtn.addEventListener('click', async () => {
        const text = ttsInput.value.trim();
        if (!text) {
            alert('请输入要转换的文本');
            return;
        }

        if (text.length > 5000) {
            alert('文本长度超过 5000 字，请缩短后重试');
            return;
        }

        generateBtn.textContent = '⏳ 生成中...';
        generateBtn.disabled = true;

        try {
            const voice = voiceSelect.value;
            const speed = parseFloat(speedRange.value);
            const pitch = parseFloat(pitchRange.value);

            // 生成语音
            const audioBlob = await ttsService.generateTTS(text, voice, speed, pitch);
            
            // 启用播放和下载按钮
            playBtn.disabled = false;
            downloadBtn.disabled = false;

            // 创建下载链接
            const url = URL.createObjectURL(audioBlob);
            downloadBtn.onclick = () => {
                const a = document.createElement('a');
                a.href = url;
                a.download = `voice-${Date.now()}.mp3`;
                a.click();
                URL.revokeObjectURL(url);
            };

            alert('✅ 语音生成成功！');
        } catch (error) {
            console.error('❌ 生成失败:', error);
            alert('❌ 语音生成失败，请重试');
        } finally {
            generateBtn.textContent = '🔊 生成语音';
            generateBtn.disabled = false;
        }
    });

    // 播放语音
    playBtn.addEventListener('click', () => {
        const text = ttsInput.value.trim();
        if (!text) return;

        const voice = voiceSelect.value;
        const speed = parseFloat(speedRange.value);
        const pitch = parseFloat(pitchRange.value);

        ttsService.play(text, voice, speed, pitch);
        playBtn.disabled = true;
        stopBtn.disabled = false;
    });

    // 停止播放
    stopBtn.addEventListener('click', () => {
        ttsService.stop();
        playBtn.disabled = false;
        stopBtn.disabled = true;
    });
}

/**
 * STT 功能初始化
 */
function initSTT() {
    const sttStart = document.getElementById('stt-start');
    const sttStop = document.getElementById('stt-stop');
    const sttOutput = document.getElementById('stt-output');
    const sttCopy = document.getElementById('stt-copy');
    const sttToTts = document.getElementById('stt-to-tts');
    const sttClear = document.getElementById('stt-clear');

    // 开始录音
    sttStart.addEventListener('click', () => {
        sttService.startListening();
    });

    // 停止录音
    sttStop.addEventListener('click', () => {
        sttService.stopListening();
    });

    // 复制文本
    sttCopy.addEventListener('click', () => {
        sttOutput.select();
        document.execCommand('copy');
        sttCopy.textContent = '✅ 已复制';
        setTimeout(() => {
            sttCopy.textContent = '📋 复制文本';
        }, 2000);
    });

    // 转为语音
    sttToTts.addEventListener('click', () => {
        const text = sttOutput.value.trim();
        if (!text) {
            alert('没有可转换的文本');
            return;
        }

        // 切换到 TTS 模式
        document.querySelector('[data-mode="tts"]').click();
        document.getElementById('tts-input').value = text;
    });

    // 清空
    sttClear.addEventListener('click', () => {
        sttOutput.value = '';
    });
}

/**
 * 字符计数
 */
function initCharacterCount() {
    const ttsInput = document.getElementById('tts-input');
    const charCount = document.getElementById('char-count');

    ttsInput.addEventListener('input', () => {
        const count = ttsInput.value.length;
        charCount.textContent = count;
        
        if (count > 5000) {
            charCount.style.color = '#ef4444';
        } else if (count > 4000) {
            charCount.style.color = '#f59e0b';
        } else {
            charCount.style.color = '#6b7280';
        }
    });
}

/**
 * 页面卸载时清理资源
 */
window.addEventListener('beforeunload', () => {
    // 停止 TTS 播放
    if (ttsService) {
        ttsService.stop();
    }
});
