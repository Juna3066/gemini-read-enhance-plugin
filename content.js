// content.js

// --- 1. 常量与配置 ---
const SELECTORS = {
    // 页面元素选择器（集中管理，便于维护）
    QUERY_CONTAINER: 'span.user-query-container',
    SIDEBAR_ID: 'my-gemini-toc',
    LIST_ID: 'toc-list'
};

const DEFAULTS = {
    contentWidth: 60,
    sidebarWidth: 260
};

const CONFIG = {
    contentWidth: parseInt(localStorage.getItem('gm_content_width')) || DEFAULTS.contentWidth,
    sidebarWidth: parseInt(localStorage.getItem('gm_sidebar_width')) || DEFAULTS.sidebarWidth,
    isSettingsOpen: false,
    isMinimized: false
};

const ICONS = {
    gear: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`,
    minimize: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 14 10 14 10 20"></polyline><polyline points="20 10 14 10 14 4"></polyline></svg>`,
    expand: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>`,
    reset: `↺`
};

// --- 2. 工具函数 ---

// 防抖函数：减少 MutationObserver 带来的频繁调用
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// --- 3. UI 构建逻辑 ---
function createSidebar() {
    if (document.getElementById(SELECTORS.SIDEBAR_ID)) return;

    const sidebar = document.createElement('div');
    sidebar.id = SELECTORS.SIDEBAR_ID;
    
    sidebar.innerHTML = `
        <div class="toc-header">
            <span class="toc-title">对话大纲</span>
            <div class="header-actions">
                <button class="icon-btn btn-settings" title="显示设置">${ICONS.gear}</button>
                <button class="icon-btn btn-toggle" title="收起面板">${ICONS.minimize}</button>
            </div>
        </div>
        
        <div id="settings-panel">
            <div class="control-group">
                <div class="control-label-row">
                    <span>正文宽幅</span>
                    <button class="reset-btn" id="reset-content" title="恢复默认">${ICONS.reset}</button>
                </div>
                <div style="display:flex; justify-content:space-between; margin-bottom:4px; font-size:10px; color:var(--text-secondary);">
                    <span>40%</span><span id="val-content">${CONFIG.contentWidth}%</span><span>100%</span>
                </div>
                <input type="range" id="slider-content" min="40" max="100" step="1" value="${CONFIG.contentWidth}">
            </div>

            <div class="control-group">
                <div class="control-label-row">
                    <span>侧栏宽度</span>
                    <button class="reset-btn" id="reset-sidebar" title="恢复默认">${ICONS.reset}</button>
                </div>
                <div style="display:flex; justify-content:space-between; margin-bottom:4px; font-size:10px; color:var(--text-secondary);">
                    <span>200px</span><span id="val-sidebar">${CONFIG.sidebarWidth}px</span><span>600px</span>
                </div>
                <input type="range" id="slider-sidebar" min="200" max="600" step="10" value="${CONFIG.sidebarWidth}">
            </div>
        </div>

        <div id="${SELECTORS.LIST_ID}"></div>
    `;
    
    document.body.appendChild(sidebar);
    applyContentWidth(CONFIG.contentWidth);
    applySidebarWidth(CONFIG.sidebarWidth);
    bindEvents();
}

function bindEvents() {
    const sidebar = document.getElementById(SELECTORS.SIDEBAR_ID);
    const settingsPanel = document.getElementById('settings-panel');
    const btnSettings = sidebar.querySelector('.btn-settings');
    const btnToggle = sidebar.querySelector('.btn-toggle');
    const sliderContent = document.getElementById('slider-content');
    const valContent = document.getElementById('val-content');
    const sliderSidebar = document.getElementById('slider-sidebar');
    const valSidebar = document.getElementById('val-sidebar');

    // 设置开关
    btnSettings.onclick = () => {
        CONFIG.isSettingsOpen = !CONFIG.isSettingsOpen;
        settingsPanel.style.display = CONFIG.isSettingsOpen ? 'block' : 'none';
        btnSettings.classList.toggle('active', CONFIG.isSettingsOpen);
    };

    // 最小化/展开
    const toggleFunc = (e) => {
        e && e.stopPropagation();
        CONFIG.isMinimized = !CONFIG.isMinimized;
        
        if (CONFIG.isMinimized) {
            sidebar.classList.add('minimized');
            btnToggle.innerHTML = ICONS.expand; 
            sidebar.title = "点击展开";
        } else {
            sidebar.classList.remove('minimized');
            btnToggle.innerHTML = ICONS.minimize; 
            sidebar.title = "";
        }
    };
    btnToggle.onclick = toggleFunc;
    sidebar.onclick = (e) => { if (CONFIG.isMinimized) toggleFunc(e); };

    // 正文宽度
    const updateContent = (val) => {
        valContent.innerText = val + '%';
        applyContentWidth(val);
        localStorage.setItem('gm_content_width', val);
        CONFIG.contentWidth = val;
    };
    sliderContent.oninput = (e) => updateContent(e.target.value);
    document.getElementById('reset-content').onclick = () => {
        sliderContent.value = DEFAULTS.contentWidth;
        updateContent(DEFAULTS.contentWidth);
    };

    // 侧栏宽度
    const updateSidebar = (val) => {
        valSidebar.innerText = val + 'px';
        applySidebarWidth(val);
        localStorage.setItem('gm_sidebar_width', val);
        CONFIG.sidebarWidth = val;
    };
    sliderSidebar.oninput = (e) => updateSidebar(e.target.value);
    document.getElementById('reset-sidebar').onclick = () => {
        sliderSidebar.value = DEFAULTS.sidebarWidth;
        updateSidebar(DEFAULTS.sidebarWidth);
    };
}

function applyContentWidth(widthPercent) {
    const containers = document.querySelectorAll('.conversation-container');
    containers.forEach(el => {
        el.style.setProperty('max-width', widthPercent + '%', 'important');
        el.style.setProperty('margin', '0 auto', 'important');
    });
}

function applySidebarWidth(widthPx) {
    const sidebar = document.getElementById(SELECTORS.SIDEBAR_ID);
    if(sidebar) {
        sidebar.style.width = widthPx + 'px';
    }
}

// --- 4. 核心功能：大纲生成 (已修复跳动 Bug) ---
function updateToc() {
    const listContainer = document.getElementById(SELECTORS.LIST_ID);
    if (!listContainer) return;

    const userQueries = document.querySelectorAll(SELECTORS.QUERY_CONTAINER);
    if (userQueries.length === 0) return;

    // A. 预先检查：长度是否变化 (快速筛选)
    const currentItems = listContainer.children;
    // 如果长度不同，肯定变了，直接进入重绘流程
    // 如果长度相同，继续检查内容
    if (currentItems.length === userQueries.length) {
        const newTexts = Array.from(userQueries).map(q => 
            q.innerText.replace(/[\r\n\s]+/g, ' ').trim()
        );
        const currentTexts = Array.from(currentItems).map(item => item.dataset.rawText || "");
        
        const isSame = currentTexts.every((t, i) => t === newTexts[i]);
        if (isSame) {
            applyContentWidth(CONFIG.contentWidth);
            return; // 内容完全一致，静止不动
        }
    }

    // B. 开始重绘 (Diff 逻辑)
    // 重新提取纯净文本
    const newTexts = Array.from(userQueries).map(q => 
        q.innerText.replace(/[\r\n\s]+/g, ' ').trim()
    ).filter(t => t.length > 0);

    // 记录状态
    const previousScrollTop = listContainer.scrollTop;
    const isUserAtBottom = (listContainer.scrollHeight - listContainer.scrollTop - listContainer.clientHeight) < 20;

    listContainer.innerHTML = ''; // 清空

    newTexts.forEach((cleanText, index) => {
        const queryElement = userQueries[index]; 
        if (!queryElement) return;

        const item = document.createElement('div');
        item.className = 'toc-item';
        item.textContent = `${index + 1}. ${cleanText}`; // 使用 textContent 更高效安全
        item.title = queryElement.innerText; 
        
        // 存入 metadata 供下次比对
        item.dataset.rawText = cleanText; 

        item.onclick = () => {
            queryElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            queryElement.style.transition = 'background 0.5s';
            queryElement.style.backgroundColor = 'rgba(255, 235, 59, 0.2)'; 
            setTimeout(() => { queryElement.style.backgroundColor = 'transparent'; }, 1200);
        };
        listContainer.appendChild(item);
    });
    
    // 恢复位置
    if (isUserAtBottom) {
        listContainer.scrollTop = listContainer.scrollHeight;
    } else {
        listContainer.scrollTop = previousScrollTop;
    }

    applyContentWidth(CONFIG.contentWidth);
}

// --- 5. 初始化 ---
function init() {
    createSidebar();
    
    // 使用防抖版 Update，避免高频触发
    const debouncedUpdate = debounce(updateToc, 1000);

    // 1. 针对本地文件/超快网速：立即尝试
    setTimeout(updateToc, 500); 
    // 2. 针对普通加载：常规兜底
    setTimeout(updateToc, 2000);

    // 3. 针对动态交互：监听变化 (传入防抖函数)
    const observer = new MutationObserver(() => {
        debouncedUpdate();
    });
    observer.observe(document.body, { childList: true, subtree: true });
}

init();