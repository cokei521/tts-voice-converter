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
                sttService.setLanguage(document.getElementById('language-select').value);
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
            const codeBlock = document.querySelector(`#${targetId} pre code`) || 
                            document.querySelector(`[data-target="${targetId}"] pre code`);
            
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
                a.download = `voice-${Date.now()