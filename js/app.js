/* ==========================================
   小账本 - 应用逻辑
   HTML + CSS + JS 纯前端实现
   数据存储在 localStorage
   ========================================== */

// ==================== 分类数据 ====================
const CATEGORIES = [
    {
        id: 'food', name: '餐饮', icon: '🍽️',
        sub: ['早餐', '午餐', '晚餐', '零食饮料', '外卖', '聚餐', '买菜']
    },
    {
        id: 'transport', name: '交通', icon: '🚗',
        sub: ['公交地铁', '出租车', '网约车', '加油', '停车费', '火车高铁', '飞机']
    },
    {
        id: 'shopping', name: '购物', icon: '🛒',
        sub: ['日用品', '数码产品', '家居用品', '书籍', '宠物用品', '其他购物']
    },
    {
        id: 'housing', name: '住房', icon: '🏠',
        sub: ['房租', '水电费', '物业费', '维修', '房贷']
    },
    {
        id: 'entertainment', name: '娱乐', icon: '🎮',
        sub: ['电影', '游戏', '旅游', '运动健身', 'KTV酒吧', '景点门票', '订阅会员']
    },
    {
        id: 'medical', name: '医疗健康', icon: '💊',
        sub: ['看病', '买药', '体检', '牙科', '保健品']
    },
    {
        id: 'education', name: '教育学习', icon: '📚',
        sub: ['培训课程', '书本教材', '考试报名', '文具']
    },
    {
        id: 'social', name: '人际社交', icon: '👥',
        sub: ['请客送礼', '红包', '人情往来', '孝敬父母']
    },
    {
        id: 'communication', name: '通讯网络', icon: '📱',
        sub: ['话费', '宽带', '快递']
    },
    {
        id: 'clothing', name: '服饰美容', icon: '👗',
        sub: ['衣服', '鞋子', '包包', '化妆品', '理发造型']
    },
    {
        id: 'home', name: '居家生活', icon: '🏡',
        sub: ['家电', '家具', '装修', '日常用品']
    },
    {
        id: 'other', name: '其他', icon: '📦',
        sub: ['其他支出']
    }
];

// 饼图颜色方案
const CHART_COLORS = [
    '#4CAF50', '#FF9800', '#2196F3', '#E91E63', '#9C27B0',
    '#00BCD4', '#FF5722', '#795548', '#607D8B', '#CDDC39',
    '#3F51B5', '#9E9E9E'
];

// ==================== 应用状态 ====================
const STORAGE_KEY = 'xiaozhangben_expenses';

let state = {
    currentPage: 'home',
    // 记账页临时状态
    addAmount: '0',
    addCategory1: null,     // 选中的一级分类 index
    addCategory2: null,     // 选中的二级分类 name
    // 账单页状态
    recordsMonth: '',       // 'YYYY-MM'
    recordsFilter: 'all',   // 'all' | category1 name
    // 待删除记录ID
    pendingDeleteId: null,
};

// ==================== 数据层 ====================

/** 从 localStorage 加载所有支出记录 */
function loadExpenses() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        console.error('数据加载失败:', e);
        return [];
    }
}

/** 保存所有支出记录到 localStorage */
function saveExpenses(expenses) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
    } catch (e) {
        console.error('数据保存失败:', e);
        showToast('⚠️ 保存失败，请检查浏览器存储空间');
    }
}

/** 添加一条支出记录 */
function addExpense(amount, category1, category2, date, note) {
    const expenses = loadExpenses();
    const now = new Date();
    const record = {
        id: generateId(),
        amount: parseFloat(amount),
        category1: category1,        // 一级分类名称
        category2: category2,        // 二级分类名称
        date: date,                  // 'YYYY-MM-DD'
        time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
        note: note || '',
        createdAt: now.toISOString(),
    };
    expenses.unshift(record); // 新记录插入最前面
    saveExpenses(expenses);
    return record;
}

/** 删除一条支出记录 */
function deleteExpense(id) {
    const expenses = loadExpenses();
    const filtered = expenses.filter(e => e.id !== id);
    saveExpenses(filtered);
}

// ==================== 工具函数 ====================

/** 生成唯一ID */
function generateId() {
    const ts = Date.now().toString(36);
    const rand = Math.random().toString(36).substring(2, 8);
    return `${ts}_${rand}`;
}

/** 格式化金额为显示字符串 */
function formatAmount(amount) {
    return '¥ ' + amount.toFixed(2);
}

/** 获取当前月份键 'YYYY-MM' */
function getMonthKey(date) {
    const d = date || new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** 获取今日日期键 'YYYY-MM-DD' */
function getTodayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** 格式化月份显示 'YYYY年M月' */
function formatMonth(monthKey) {
    const [y, m] = monthKey.split('-');
    return `${y}年${parseInt(m)}月`;
}

/** 格式化日期显示 'M月D日 周X' */
function formatDate(dateStr) {
    const d = new Date(dateStr);
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return `${d.getMonth() + 1}月${d.getDate()}日 ${weekDays[d.getDay()]}`;
}

/** 获取一级分类的图标 */
function getCategoryIcon(category1Name) {
    const cat = CATEGORIES.find(c => c.name === category1Name);
    return cat ? cat.icon : '📦';
}

/** Toast 提示 */
let toastTimer = null;
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.classList.remove('show');
    }, 1500);
}

/** 确认对话框 */
function showConfirm(message) {
    return new Promise((resolve) => {
        const overlay = document.getElementById('confirm-overlay');
        const msgEl = document.getElementById('confirm-message');
        const cancelBtn = document.getElementById('confirm-cancel');
        const okBtn = document.getElementById('confirm-ok');

        msgEl.textContent = message;
        overlay.classList.add('show');

        function cleanup() {
            overlay.classList.remove('show');
            cancelBtn.removeEventListener('click', onCancel);
            okBtn.removeEventListener('click', onOk);
        }

        function onCancel() {
            cleanup();
            resolve(false);
        }

        function onOk() {
            cleanup();
            resolve(true);
        }

        cancelBtn.addEventListener('click', onCancel);
        okBtn.addEventListener('click', onOk);
    });
}

// ==================== 页面导航 ====================

function switchPage(pageName) {
    // 更新页面显示
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${pageName}`).classList.add('active');

    // 更新底部导航
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`.nav-btn[data-page="${pageName}"]`).classList.add('active');

    state.currentPage = pageName;

    // 根据页面刷新数据
    switch (pageName) {
        case 'home':
            renderHome();
            break;
        case 'add':
            resetAddPage();
            break;
        case 'records':
            renderRecords();
            break;
        case 'stats':
            renderStats();
            break;
    }
}

// ==================== 首页 ====================

function renderHome() {
    const now = new Date();
    const monthKey = getMonthKey(now);
    const todayKey = getTodayKey();
    const expenses = loadExpenses();

    // 更新头部月份
    document.getElementById('header-month').textContent = formatMonth(monthKey);

    // 计算本月总支出
    const monthlyExpenses = expenses.filter(e => e.date.startsWith(monthKey));
    const monthlyTotal = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);
    document.getElementById('monthly-total').textContent = formatAmount(monthlyTotal);

    // 计算今日支出
    const todayExpenses = expenses.filter(e => e.date === todayKey);
    const todayTotal = todayExpenses.reduce((sum, e) => sum + e.amount, 0);
    document.getElementById('today-total').textContent = formatAmount(todayTotal);

    // 渲染最近5条记录
    const recentList = document.getElementById('recent-list');
    const recent = expenses.slice(0, 5);

    if (recent.length === 0) {
        recentList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📝</div>
                <div>还没有记账哦</div>
                <div class="empty-hint">点击下方 ✏️记账 开始吧！</div>
            </div>`;
    } else {
        recentList.innerHTML = recent.map(e => `
            <div class="record-item">
                <div class="record-icon">${getCategoryIcon(e.category1)}</div>
                <div class="record-info">
                    <div class="record-category">${e.category1} · ${e.category2}</div>
                    <div class="record-meta">
                        <span>${e.date.substring(5)}</span>
                        <span>${e.time}</span>
                        ${e.note ? `<span>${e.note}</span>` : ''}
                    </div>
                </div>
                <div class="record-amount">-${e.amount.toFixed(2)}</div>
            </div>
        `).join('');
    }
}

// ==================== 记账页 ====================

/** 重置记账页到初始状态 */
function resetAddPage() {
    state.addAmount = '0';
    state.addCategory1 = null;
    state.addCategory2 = null;
    updateAmountDisplay();
    renderCategory1Grid();
    renderCategory2Row();
    document.getElementById('expense-date').value = getTodayKey();
    document.getElementById('expense-note').value = '';
    document.getElementById('save-btn').disabled = true;
    updateSaveButton();
}

/** 更新金额显示 */
function updateAmountDisplay() {
    const val = state.addAmount;
    const display = document.getElementById('amount-display');
    const valueEl = document.getElementById('amount-value');
    const decimalEl = document.getElementById('amount-decimal');

    if (val === '0' || val === '') {
        valueEl.textContent = '0';
        decimalEl.textContent = '.00';
        display.classList.remove('has-value');
    } else if (val.includes('.')) {
        const [intPart, decPart] = val.split('.');
        valueEl.textContent = intPart || '0';
        decimalEl.textContent = '.' + (decPart || '00').padEnd(2, '0').substring(0, 2);
        display.classList.add('has-value');
    } else {
        valueEl.textContent = val;
        decimalEl.textContent = '.00';
        display.classList.add('has-value');
    }
}

/** 处理数字键盘输入 */
function handleNumpadKey(key) {
    let current = state.addAmount;
    const MAX_INT_LENGTH = 8; // 最大8位整数
    const MAX_DECIMAL = 2;    // 最多2位小数

    if (key === 'del') {
        if (current.length <= 1 || current === '0') {
            current = '0';
        } else {
            current = current.substring(0, current.length - 1);
        }
    } else if (key === '.') {
        if (current.includes('.')) return; // 已有小数点
        if (current === '0' || current === '') {
            current = '0.';
        } else {
            current += '.';
        }
    } else {
        // 数字键 0-9
        if (current === '0') {
            current = key;
        } else {
            // 检查长度限制
            if (current.includes('.')) {
                const decPart = current.split('.')[1];
                if (decPart && decPart.length >= MAX_DECIMAL) return;
            } else {
                if (current.length >= MAX_INT_LENGTH) return;
            }
            current += key;
        }
    }

    state.addAmount = current;
    updateAmountDisplay();
    updateSaveButton();
}

/** 渲染一级分类网格 */
function renderCategory1Grid() {
    const grid = document.getElementById('category1-grid');
    grid.innerHTML = CATEGORIES.map((cat, index) => `
        <div class="category1-item${state.addCategory1 === index ? ' selected' : ''}"
             data-index="${index}">
            <span class="category1-icon">${cat.icon}</span>
            <span class="category1-name">${cat.name}</span>
        </div>
    `).join('');

    // 绑定点击事件
    grid.querySelectorAll('.category1-item').forEach(item => {
        item.addEventListener('click', () => {
            const index = parseInt(item.dataset.index);
            selectCategory1(index);
        });
    });
}

/** 选择一级分类 */
function selectCategory1(index) {
    if (state.addCategory1 === index) {
        // 再次点击取消选中
        state.addCategory1 = null;
        state.addCategory2 = null;
    } else {
        state.addCategory1 = index;
        state.addCategory2 = null; // 切换一级分类时重置二级
    }
    renderCategory1Grid();
    renderCategory2Row();
    updateSaveButton();
}

/** 渲染二级分类标签 */
function renderCategory2Row() {
    const row = document.getElementById('category2-row');

    if (state.addCategory1 === null) {
        row.innerHTML = '<span style="font-size:13px;color:#CCC;">请先选择一级分类</span>';
        return;
    }

    const cat = CATEGORIES[state.addCategory1];
    row.innerHTML = cat.sub.map(sub => `
        <span class="category2-tag${state.addCategory2 === sub ? ' selected' : ''}"
              data-sub="${sub}">${sub}</span>
    `).join('');

    // 绑定点击事件
    row.querySelectorAll('.category2-tag').forEach(tag => {
        tag.addEventListener('click', () => {
            const sub = tag.dataset.sub;
            selectCategory2(sub);
        });
    });
}

/** 选择二级分类 */
function selectCategory2(subName) {
    if (state.addCategory2 === subName) {
        state.addCategory2 = null;
    } else {
        state.addCategory2 = subName;
    }
    renderCategory2Row();
    updateSaveButton();
}

/** 更新保存按钮状态 */
function updateSaveButton() {
    const btn = document.getElementById('save-btn');
    const amount = parseFloat(state.addAmount);
    const valid = amount > 0 && state.addCategory1 !== null && state.addCategory2 !== null;
    btn.disabled = !valid;
}

/** 保存记录 */
function handleSave() {
    const amount = parseFloat(state.addAmount);
    if (isNaN(amount) || amount <= 0) {
        showToast('⚠️ 请输入正确的金额');
        return;
    }
    if (state.addCategory1 === null || state.addCategory2 === null) {
        showToast('⚠️ 请选择分类');
        return;
    }

    const category1 = CATEGORIES[state.addCategory1].name;
    const date = document.getElementById('expense-date').value || getTodayKey();
    const note = document.getElementById('expense-note').value.trim();

    addExpense(amount.toFixed(2), category1, state.addCategory2, date, note);

    showToast('✅ 记录成功！');
    resetAddPage();
}

// ==================== 账单页 ====================

/** 初始化账单页月份 */
function initRecordsMonth() {
    if (!state.recordsMonth) {
        state.recordsMonth = getMonthKey();
    }
}

/** 渲染账单页 */
function renderRecords() {
    initRecordsMonth();

    // 更新月份标签
    document.getElementById('records-month').textContent = formatMonth(state.recordsMonth);

    // 渲染分类筛选标签
    renderFilterRow();

    // 渲染记录列表
    renderRecordsList();
}

/** 渲染分类筛选标签 */
function renderFilterRow() {
    const filterRow = document.getElementById('filter-row');
    const filters = [
        { key: 'all', label: '全部' },
        ...CATEGORIES.map(c => ({ key: c.name, label: c.icon + ' ' + c.name }))
    ];

    filterRow.innerHTML = filters.map(f => `
        <span class="filter-tag${state.recordsFilter === f.key ? ' selected' : ''}"
              data-filter="${f.key}">${f.label}</span>
    `).join('');

    filterRow.querySelectorAll('.filter-tag').forEach(tag => {
        tag.addEventListener('click', () => {
            state.recordsFilter = tag.dataset.filter;
            renderFilterRow();
            renderRecordsList();
        });
    });
}

/** 渲染记录列表 */
function renderRecordsList() {
    const list = document.getElementById('records-list');
    const totalEl = document.getElementById('records-total-amount');
    const expenses = loadExpenses();

    // 按月份筛选
    let filtered = expenses.filter(e => e.date.startsWith(state.recordsMonth));

    // 按分类筛选
    if (state.recordsFilter !== 'all') {
        filtered = filtered.filter(e => e.category1 === state.recordsFilter);
    }

    // 计算合计
    const total = filtered.reduce((sum, e) => sum + e.amount, 0);
    totalEl.textContent = formatAmount(total);

    if (filtered.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📭</div>
                <div>该月份没有记录</div>
            </div>`;
        return;
    }

    // 按日期分组
    const grouped = {};
    filtered.forEach(e => {
        if (!grouped[e.date]) grouped[e.date] = [];
        grouped[e.date].push(e);
    });

    // 按日期倒序排列
    const dates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

    let html = '';
    dates.forEach(date => {
        html += `<div class="date-group-header">📅 ${formatDate(date)}</div>`;
        grouped[date].forEach(e => {
            html += `
                <div class="record-item">
                    <div class="record-icon">${getCategoryIcon(e.category1)}</div>
                    <div class="record-info">
                        <div class="record-category">${e.category1} · ${e.category2}</div>
                        <div class="record-meta">
                            <span>${e.time}</span>
                            ${e.note ? `<span>${e.note}</span>` : ''}
                        </div>
                    </div>
                    <div class="record-amount">-${e.amount.toFixed(2)}</div>
                    <button class="record-delete" data-id="${e.id}" title="删除">🗑️</button>
                </div>
            `;
        });
    });

    list.innerHTML = html;

    // 绑定删除按钮
    list.querySelectorAll('.record-delete').forEach(btn => {
        btn.addEventListener('click', async (evt) => {
            evt.stopPropagation();
            const id = btn.dataset.id;
            const confirmed = await showConfirm('确定要删除这条记录吗？删除后无法恢复。');
            if (confirmed) {
                deleteExpense(id);
                showToast('🗑️ 已删除');
                renderRecords();
                // 如果当前在首页，也刷新首页
                if (state.currentPage === 'records') {
                    // 保持在账单页
                }
            }
        });
    });
}

/** 切换月份 */
function changeMonth(delta) {
    const [y, m] = state.recordsMonth.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    state.recordsMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    renderRecords();
}

// ==================== 统计页 ====================

function renderStats() {
    const monthKey = state.recordsMonth || getMonthKey();
    const expenses = loadExpenses();

    // 更新月份显示
    document.getElementById('stats-month').textContent = formatMonth(monthKey);

    // 筛选当月数据
    const monthly = expenses.filter(e => e.date.startsWith(monthKey));
    const total = monthly.reduce((sum, e) => sum + e.amount, 0);

    // 更新总支出
    document.getElementById('stats-total').textContent = formatAmount(total);

    if (total === 0) {
        document.getElementById('chart-container').innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📊</div>
                <div>本月暂无支出数据</div>
            </div>`;
        document.getElementById('ranking-list').innerHTML = '';
        return;
    }

    // 按一级分类汇总
    const categorySum = {};
    monthly.forEach(e => {
        if (!categorySum[e.category1]) {
            categorySum[e.category1] = 0;
        }
        categorySum[e.category1] += e.amount;
    });

    // 排序
    const sorted = Object.entries(categorySum).sort((a, b) => b[1] - a[1]);

    // 绘制饼图
    drawPieChart(sorted, total);

    // 渲染排行榜
    renderRanking(sorted, total);
}

/** 用 Canvas 绘制饼图 */
function drawPieChart(sortedData, total) {
    const canvas = document.getElementById('pie-chart');
    const container = document.getElementById('chart-container');

    // 恢复 canvas 容器结构
    container.innerHTML = `
        <canvas id="pie-chart" width="280" height="280"></canvas>
        <div class="chart-legend" id="chart-legend"></div>
    `;

    const newCanvas = document.getElementById('pie-chart');
    const legendEl = document.getElementById('chart-legend');
    const ctx = newCanvas.getContext('2d');
    const cx = 140, cy = 140, radius = 110;

    // 清空画布
    ctx.clearRect(0, 0, 280, 280);

    let startAngle = -Math.PI / 2; // 从顶部开始

    sortedData.forEach((entry, i) => {
        const [name, amount] = entry;
        const sliceAngle = (amount / total) * Math.PI * 2;
        const color = CHART_COLORS[i % CHART_COLORS.length];

        // 绘制扇形
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, radius, startAngle, startAngle + sliceAngle);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();

        // 扇形边框
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 绘制百分比文字（在扇形中间）
        const percent = ((amount / total) * 100).toFixed(1);
        if (parseFloat(percent) >= 5) {
            // 只在占比>=5%的扇形中显示文字
            const midAngle = startAngle + sliceAngle / 2;
            const textR = radius * 0.65;
            const tx = cx + Math.cos(midAngle) * textR;
            const ty = cy + Math.sin(midAngle) * textR;

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 12px -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(percent + '%', tx, ty);
        }

        // 图例
        const legendItem = document.createElement('div');
        legendItem.className = 'legend-item';
        legendItem.innerHTML = `
            <span class="legend-dot" style="background:${color}"></span>
            <span class="legend-name">${getCategoryIcon(name)} ${name}</span>
            <span class="legend-percent">${percent}%</span>
        `;
        legendEl.appendChild(legendItem);

        startAngle += sliceAngle;
    });

    // 中间白色圆形（甜甜圈效果）
    ctx.beginPath();
    ctx.arc(cx, cy, 55, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.strokeStyle = '#F0F0F0';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 中间总计文字
    ctx.fillStyle = '#333';
    ctx.font = 'bold 14px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('总支出', cx, cy - 8);
    ctx.font = 'bold 16px -apple-system, sans-serif';
    ctx.fillText(formatAmount(total), cx, cy + 12);
}

/** 渲染分类排行榜 */
function renderRanking(sortedData, total) {
    const list = document.getElementById('ranking-list');

    list.innerHTML = sortedData.map((entry, i) => {
        const [name, amount] = entry;
        const percent = ((amount / total) * 100).toFixed(1);
        let rankClass = 'normal';
        let rankIcon = (i + 1).toString();
        if (i === 0) { rankClass = 'top1'; rankIcon = '🥇'; }
        else if (i === 1) { rankClass = 'top2'; rankIcon = '🥈'; }
        else if (i === 2) { rankClass = 'top3'; rankIcon = '🥉'; }

        return `
            <div class="ranking-item">
                <span class="rank-num ${rankClass}">${rankIcon}</span>
                <span class="rank-category">${getCategoryIcon(name)} ${name}</span>
                <div class="rank-bar-wrap">
                    <div class="rank-bar" style="width:${Math.max(percent, 2)}%"></div>
                </div>
                <span class="rank-amount">${formatAmount(amount)}</span>
            </div>
        `;
    }).join('');
}

// ==================== 事件绑定 ====================

/** 底部导航点击 */
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const page = btn.dataset.page;
        switchPage(page);
    });
});

/** 数字键盘点击 */
document.querySelectorAll('.numpad-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        handleNumpadKey(btn.dataset.key);
    });
});

/** 保存按钮 */
document.getElementById('save-btn').addEventListener('click', handleSave);

/** 账单页月份切换 */
document.getElementById('month-prev').addEventListener('click', () => changeMonth(-1));
document.getElementById('month-next').addEventListener('click', () => changeMonth(1));

/** 日期输入默认值 */
document.getElementById('expense-date').value = getTodayKey();

// ==================== 键盘支持（桌面端） ====================
document.addEventListener('keydown', (evt) => {
    // 仅在记账页激活时处理
    if (state.currentPage !== 'add') return;

    const key = evt.key;
    if (key >= '0' && key <= '9') {
        handleNumpadKey(key);
    } else if (key === '.' || key === '。') {
        handleNumpadKey('.');
    } else if (key === 'Backspace' || key === 'Delete') {
        handleNumpadKey('del');
    } else if (key === 'Enter') {
        evt.preventDefault();
        handleSave();
    }
});

// ==================== 初始化 ====================
function init() {
    switchPage('home');
    // 初始化账单页月份为当前月份
    state.recordsMonth = getMonthKey();
}

// 启动应用
init();
