// content.js - V3.0.0 (Ultimate Performance: Caching + Noise Reduction)

// --- 1. 常量与配置 (Constants & Config) ---
const SELECTORS = {
    QUERY_CONTAINER: 'span.user-query-container',
    SIDEBAR_ID: 'my-gemini-toc',
    LIST_ID: 'toc-list'
};

const DEFAULTS = {
    contentWidth: 60,
    sidebarWidth: 260,
    contentOffset: 0
};

const CONFIG = {
    contentWidth: parseInt(localStorage.getItem('gm_content_width')) || DEFAULTS.contentWidth,
    sidebarWidth: parseInt(localStorage.getItem('gm_sidebar_width')) || DEFAULTS.sidebarWidth,
    contentOffset: parseInt(localStorage.getItem('gm_content_offset')) || DEFAULTS.contentOffset,
    isSettingsOpen: false,
    isMinimized: false
};

const ICONS = {
    gear: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`,
    minimize: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 14 10 14 10 20"></polyline><polyline points="20 10 14 10 14 4"></polyline></svg>`,
    expand: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>`,
    reset: `↺`
};

// --- 2. 全局状态与工具 (State & Utils) ---
let isClicking = false;
let clickTimer = null;
let tocObserver = null;

// [优化 1] 文本缓存池：使用 WeakMap，DOM 节点被移除后自动释放内存
const textCache = new WeakMap();

// [优化 1] 极速文本提取（带缓存）
function extractText(element) {
    // 命中缓存直接返回，O(1) 复杂度
    if (textCache.has(element)) {
        return textCache.get(element);
    }
    
    // 未命中则计算，并存入缓存
    const text = element.textContent.replace(/[\r\n\s]+/g, ' ').trim();
    textCache.set(element, text);
    return text;
}

// 空闲调度防抖
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

// 核心：设置高亮项
function setActiveItem(index) {
    const listContainer = document.getElementById(SELECTORS.LIST_ID);
    if (!listContainer) return;

    const currentActive = listContainer.querySelector('.toc-item.active');
    if (currentActive && parseInt(currentActive.dataset.index) === index) return;

    if (currentActive) currentActive.classList.remove('active');
    
    const newItem = listContainer.querySelector(`.toc-item[data-index="${index}"]`);
    if (newItem) {
        newItem.classList.add('active');
        if (!isClicking) {
            newItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }
}

// --- 3. UI 构建 (UI Rendering) ---
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
                    <span>← 左移</span>
                    <span id="val-offset">${CONFIG.contentOffset > 0 ? '+' : ''}${CONFIG.contentOffset}px</span>
                    <span>右移 →</span>
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
    applyContentOffset(CONFIG.contentOffset); 
    applySidebarWidth(CONFIG.sidebarWidth);
    bindEvents();
}

// --- 4. 事件绑定 (Event Binding) ---
function bindEvents() {
    const sidebar = document.getElementById(SELECTORS.SIDEBAR_ID);
    const settingsPanel = document.getElementById('settings-panel');
    const btnSettings = sidebar.querySelector('.btn-settings');
    const btnToggle = sidebar.querySelector('.btn-toggle');
    
    // Sliders
    const sliderContent = document.getElementById('slider-content');
    const valContent = document.getElementById('val-content');
    const sliderOffset = document.getElementById('slider-offset');
    const valOffset = document.getElementById('val-offset');
    const sliderSidebar = document.getElementById('slider-sidebar');
    const valSidebar = document.getElementById('val-sidebar');

    btnSettings.onclick = () => {
        CONFIG.isSettingsOpen = !CONFIG.isSettingsOpen;
        settingsPanel.style.display = CONFIG.isSettingsOpen ? 'block' : 'none';
        btnSettings.classList.toggle('active', CONFIG.isSettingsOpen);
    };

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

    // --- Slider Logic ---
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

    const updateOffset = (val) => {
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

    // --- 列表点击委托 ---
    const listContainer = document.getElementById(SELECTORS.LIST_ID);
    listContainer.onclick = (e) => {
        const item = e.target.closest('.toc-item');
        if (!item) return;

        isClicking = true;
        if (clickTimer) clearTimeout(clickTimer);
        clickTimer = setTimeout(() => { isClicking = false; }, 1000); 

        setActiveItem(parseInt(item.dataset.index));

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

function applyContentWidth(widthPercent) {
    const containers = document.querySelectorAll('.conversation-container');
    containers.forEach(el => {
        el.style.setProperty('max-width', widthPercent + '%', 'important');
    });
}

function applyContentOffset(offsetPx) {
    const containers = document.querySelectorAll('.conversation-container');
    containers.forEach(el => {
        el.style.setProperty('--content-offset', offsetPx + 'px');
    });
}

function applySidebarWidth(widthPx) {
    const sidebar = document.getElementById(SELECTORS.SIDEBAR_ID);
    if(sidebar) {
        sidebar.style.width = widthPx + 'px';
    }
}

// --- 5. 滚动监听逻辑 ---
function initScrollSpy() {
    const options = {
        root: null, 
        rootMargin: '-10% 0px -85% 0px', 
        threshold: 0
    };

    tocObserver = new IntersectionObserver((entries) => {
        if (isClicking) return;

        entries.forEach(entry => {
            const index = parseInt(entry.target.dataset.index);
            if (isNaN(index)) return;

            if (entry.isIntersecting) {
                setActiveItem(index);
            } 
            else if (entry.boundingClientRect.top > 0) {
                if (index > 0) {
                    setActiveItem(index - 1);
                }
            }
        });
    }, options);
}

// --- 6. 核心大纲生成逻辑 ---
function updateToc() {
    const listContainer = document.getElementById(SELECTORS.LIST_ID);
    if (!listContainer) return;

    const userQueries = document.querySelectorAll(SELECTORS.QUERY_CONTAINER);

    if (userQueries.length === 0) {
        if (listContainer.children.length > 0) listContainer.innerHTML = '';
        return;
    }

    const currentItems = listContainer.children;
    const oldLength = currentItems.length;
    
    const currentActiveItem = listContainer.querySelector('.toc-item.active');
    let activeIndex = currentActiveItem ? parseInt(currentActiveItem.dataset.index) : -1;

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

    if (shouldUpdate) {
        if (!newTexts) {
            newTexts = Array.from(userQueries).map(extractText).filter(t => t.length > 0);
        }
        const newLength = newTexts.length;

        if (newLength > oldLength) {
            activeIndex = newLength - 1;
        }

        const previousScrollTop = listContainer.scrollTop;
        const isUserAtBottom = (listContainer.scrollHeight - listContainer.scrollTop - listContainer.clientHeight) < 20;

        listContainer.innerHTML = ''; 
        const fragment = document.createDocumentFragment();

        if (tocObserver) tocObserver.disconnect();

        newTexts.forEach((cleanText, index) => {
            const item = document.createElement('div');
            item.className = 'toc-item';
            
            if (index === activeIndex) {
                item.classList.add('active');
            }

            item.textContent = `${index + 1}. ${cleanText}`; 
            item.title = cleanText; 
            item.dataset.rawText = cleanText; 
            item.dataset.index = index; 

            fragment.appendChild(item);

            const queryEl = userQueries[index];
            if (queryEl) {
                queryEl.dataset.index = index; 
                if (tocObserver) tocObserver.observe(queryEl);
            }
        });
        
        listContainer.appendChild(fragment); 
        
        if (isUserAtBottom || newLength > oldLength) {
            listContainer.scrollTop = listContainer.scrollHeight;
        } else {
            listContainer.scrollTop = previousScrollTop;
        }
    } else {
        if (tocObserver) {
            tocObserver.disconnect();
            userQueries.forEach((el, index) => {
                el.dataset.index = index;
                tocObserver.observe(el);
            });
        }
    }

    applyContentWidth(CONFIG.contentWidth);
    applyContentOffset(CONFIG.contentOffset);
}

// --- 7. 初始化 ---
function init() {
    createSidebar();
    initScrollSpy();

    const efficientUpdate = idleDebounce(updateToc, 1000);

    setTimeout(updateToc, 500); 
    setTimeout(updateToc, 2000);

    // [优化 2] 观察者降噪：智能过滤无效 DOM 变动
    // 只有当变动涉及 .user-query-container 时才触发更新
    // 这屏蔽了 Gemini 生成回答时 99% 的 DOM 操作
    const observer = new MutationObserver((mutations) => {
        let isRelevantChange = false;

        for (const mutation of mutations) {
            // 1. 检查是否有新增/删除的节点
            if (mutation.type === 'childList') {
                // 检查新增节点
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === 1) { // 元素节点
                        // 如果新增节点本身是提问，或者包含提问
                        if (node.matches && node.matches(SELECTORS.QUERY_CONTAINER) || 
                            node.querySelector && node.querySelector(SELECTORS.QUERY_CONTAINER)) {
                            isRelevantChange = true;
                            break;
                        }
                    }
                }
                if (isRelevantChange) break;

                // 检查删除节点
                for (const node of mutation.removedNodes) {
                    if (node.nodeType === 1) {
                        if (node.matches && node.matches(SELECTORS.QUERY_CONTAINER) || 
                            node.querySelector && node.querySelector(SELECTORS.QUERY_CONTAINER)) {
                            isRelevantChange = true;
                            break;
                        }
                    }
                }
                if (isRelevantChange) break;
            }
            // 2. 检查文本变动 (针对用户编辑提问的情况)
            else if (mutation.type === 'characterData' || mutation.type === 'subtree') {
                // 如果变动的目标是提问容器的子孙
                if (mutation.target.parentElement && 
                    mutation.target.parentElement.closest(SELECTORS.QUERY_CONTAINER)) {
                    isRelevantChange = true;
                    break;
                }
            }
        }

        if (isRelevantChange) {
            efficientUpdate();
        }
    });

    // 依然需要 subtree: true，但回调里会进行过滤
    observer.observe(document.body, { 
        childList: true, 
        subtree: true, 
        characterData: true // 监听文本变化
    });
}

init();