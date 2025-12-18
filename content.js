// content.js - Ultimate Performance Version + Horizontal Offset

// --- 1. 常量与配置 ---
const SELECTORS = {
    QUERY_CONTAINER: 'span.user-query-container',
    SIDEBAR_ID: 'my-gemini-toc',
    LIST_ID: 'toc-list'
};

const DEFAULTS = {
    contentWidth: 60,
    sidebarWidth: 260,
    contentOffset: 0 // 新增默认偏移量
};

const CONFIG = {
    contentWidth: parseInt(localStorage.getItem('gm_content_width')) || DEFAULTS.contentWidth,
    sidebarWidth: parseInt(localStorage.getItem('gm_sidebar_width')) || DEFAULTS.sidebarWidth,
    contentOffset: parseInt(localStorage.getItem('gm_content_offset')) || DEFAULTS.contentOffset, // 读取偏移配置
    isSettingsOpen: false,
    isMinimized: false
};

const ICONS = {
    gear: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`,
    minimize: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 14 10 14 10 20"></polyline><polyline points="20 10 14 10 14 4"></polyline></svg>`,
    expand: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>`,
    reset: `↺`
};

// --- 2. 高级工具函数 ---

function extractText(element) {
    return element.textContent.replace(/[\r\n\s]+/g, ' ').trim();
}

function idleDebounce(func, wait) {
    let timerId = null;
    return (...args) => {
        if (timerId) clearTimeout(timerId);
        timerId = setTimeout(() => {
            if ('requestIdleCallback' in window) {
                requestIdleCallback(() => func.apply(this, args));
            } else {
                func.apply(this, args);
            }
        }, wait);
    };
}

// --- 3. UI 构建 ---
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
                    <span>正文位置</span>
                    <button class="reset-btn" id="reset-offset" title="居中还原">${ICONS.reset}</button>
                </div>
                <div style="display:flex; justify-content:space-between; margin-bottom:4px; font-size:10px; color:var(--text-secondary);">
                    <span>← 左移</span><span id="val-offset">${CONFIG.contentOffset}px</span><span>右移 →</span>
                </div>
                <input type="range" id="slider-offset" min="-400" max="400" step="10" value="${CONFIG.contentOffset}">
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
    applyContentOffset(CONFIG.contentOffset); // 初始化应用偏移
    applySidebarWidth(CONFIG.sidebarWidth);
    bindEvents();
}

// --- 4. 事件绑定 ---
function bindEvents() {
    const sidebar = document.getElementById(SELECTORS.SIDEBAR_ID);
    const settingsPanel = document.getElementById('settings-panel');
    const btnSettings = sidebar.querySelector('.btn-settings');
    const btnToggle = sidebar.querySelector('.btn-toggle');
    
    // 宽幅控件
    const sliderContent = document.getElementById('slider-content');
    const valContent = document.getElementById('val-content');
    
    // 偏移控件 (新增)
    const sliderOffset = document.getElementById('slider-offset');
    const valOffset = document.getElementById('val-offset');

    // 侧栏控件
    const sliderSidebar = document.getElementById('slider-sidebar');
    const valSidebar = document.getElementById('val-sidebar');

    // 设置开关
    btnSettings.onclick = () => {
        CONFIG.isSettingsOpen = !CONFIG.isSettingsOpen;
        settingsPanel.style.display = CONFIG.isSettingsOpen ? 'block' : 'none';
        btnSettings.classList.toggle('active', CONFIG.isSettingsOpen);
    };

    // 最小化
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

    // --- 逻辑：宽幅 ---
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

    // --- 逻辑：水平偏移 (新增) ---
    const updateOffset = (val) => {
        // 显示正负号，让用户更直观
        const sign = val > 0 ? '+' : '';
        valOffset.innerText = `${sign}${val}px`;
        applyContentOffset(val);
        localStorage.setItem('gm_content_offset', val);
        CONFIG.contentOffset = val;
    };
    sliderOffset.oninput = (e) => updateOffset(e.target.value);
    document.getElementById('reset-offset').onclick = () => {
        sliderOffset.value = DEFAULTS.contentOffset;
        updateOffset(DEFAULTS.contentOffset);
    };

    // --- 逻辑：侧栏宽度 ---
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

    // 列表点击事件委托 (含高亮)
    const listContainer = document.getElementById(SELECTORS.LIST_ID);
    listContainer.onclick = (e) => {
        const item = e.target.closest('.toc-item');
        if (!item) return;

        // 高亮逻辑
        const currentActive = listContainer.querySelector('.toc-item.active');
        if (currentActive) currentActive.classList.remove('active');
        item.classList.add('active');

        const index = parseInt(item.dataset.index);
        const userQueries = document.querySelectorAll(SELECTORS.QUERY_CONTAINER);
        const targetElement = userQueries[index];

        if (targetElement && targetElement.isConnected) {
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            targetElement.style.transition = 'background 0.5s';
            targetElement.style.backgroundColor = 'rgba(255, 235, 59, 0.2)'; 
            setTimeout(() => { targetElement.style.backgroundColor = 'transparent'; }, 1200);
        } else {
            updateToc();
        }
    };
}

// 辅助函数：应用正文宽幅
function applyContentWidth(widthPercent) {
    const containers = document.querySelectorAll('.conversation-container');
    containers.forEach(el => {
        el.style.setProperty('max-width', widthPercent + '%', 'important');
    });
}

// 辅助函数：应用水平偏移 (新增)
function applyContentOffset(offsetPx) {
    const containers = document.querySelectorAll('.conversation-container');
    containers.forEach(el => {
        // 使用 CSS 变量，性能更高
        el.style.setProperty('--content-offset', offsetPx + 'px');
    });
}

function applySidebarWidth(widthPx) {
    const sidebar = document.getElementById(SELECTORS.SIDEBAR_ID);
    if(sidebar) {
        sidebar.style.width = widthPx + 'px';
    }
}

// --- 5. 核心大纲逻辑 (含自动高亮) ---
function updateToc() {
    const listContainer = document.getElementById(SELECTORS.LIST_ID);
    if (!listContainer) return;

    const userQueries = document.querySelectorAll(SELECTORS.QUERY_CONTAINER);

    // 1. 处理空状态
    if (userQueries.length === 0) {
        if (listContainer.children.length > 0) listContainer.innerHTML = '';
        return;
    }

    // --- 准备数据 ---
    const currentItems = listContainer.children;
    const oldLength = currentItems.length; // 记录旧长度
    
    // 获取当前被选中的索引（记忆状态）
    const currentActiveItem = listContainer.querySelector('.toc-item.active');
    let activeIndex = currentActiveItem ? parseInt(currentActiveItem.dataset.index) : -1;

    // 2. 智能 Diff 检测
    let shouldUpdate = false;
    let newTexts = null;

    if (oldLength !== userQueries.length) {
        shouldUpdate = true;
    } else {
        newTexts = Array.from(userQueries).map(extractText).filter(t => t.length > 0);
        if (newTexts.length !== oldLength) {
            shouldUpdate = true;
        } else {
            const currentTexts = Array.from(currentItems).map(item => item.dataset.rawText || "");
            const isContentSame = currentTexts.every((t, i) => t === newTexts[i]);
            const isDomAlive = userQueries[0].isConnected; 

            if (!isContentSame || !isDomAlive) {
                shouldUpdate = true;
            }
        }
    }

    if (!shouldUpdate) {
        applyContentWidth(CONFIG.contentWidth);
        applyContentOffset(CONFIG.contentOffset);
        return;
    }

    // --- 3. 计算目标高亮索引 (关键修复) ---
    // 重新提取文本（如果上面没提取过）
    if (!newTexts) {
        newTexts = Array.from(userQueries).map(extractText).filter(t => t.length > 0);
    }
    
    const newLength = newTexts.length;

    // 逻辑：如果是新增记录（新长度 > 旧长度），则自动高亮最后一条
    // 否则（长度没变，只是文字变了），保持原来的 activeIndex 不变
    if (newLength > oldLength) {
        activeIndex = newLength - 1; // 选中最后一个
    }

    // --- 4. 执行重绘 ---
    const previousScrollTop = listContainer.scrollTop;
    const isUserAtBottom = (listContainer.scrollHeight - listContainer.scrollTop - listContainer.clientHeight) < 20;

    listContainer.innerHTML = ''; 
    const fragment = document.createDocumentFragment();

    newTexts.forEach((cleanText, index) => {
        const item = document.createElement('div');
        item.className = 'toc-item';
        
        // 【新增】如果在目标索引上，直接加上 active 类
        if (index === activeIndex) {
            item.classList.add('active');
        }

        item.textContent = `${index + 1}. ${cleanText}`; 
        item.title = cleanText; 
        item.dataset.rawText = cleanText; 
        item.dataset.index = index; 

        fragment.appendChild(item);
    });
    
    listContainer.appendChild(fragment); 
    
    // 恢复滚动位置
    if (isUserAtBottom || newLength > oldLength) { 
        // 如果之前在底部，或者有新内容增加，自动滚到底部看最新的
        listContainer.scrollTop = listContainer.scrollHeight;
    } else {
        listContainer.scrollTop = previousScrollTop;
    }

    applyContentWidth(CONFIG.contentWidth);
    applyContentOffset(CONFIG.contentOffset);
}

// --- 6. 初始化 ---
function init() {
    createSidebar();
    
    const efficientUpdate = idleDebounce(updateToc, 1000);

    setTimeout(updateToc, 500); 
    setTimeout(updateToc, 2000);

    const observer = new MutationObserver(() => {
        efficientUpdate();
    });
    observer.observe(document.body, { childList: true, subtree: true });
}

init();