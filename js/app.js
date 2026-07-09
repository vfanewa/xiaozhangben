/* ==========================================
   小账本 - 应用逻辑
   HTML + CSS + JS 纯前端实现
   数据存储在 localStorage
   支持支出和收入两种记录类型
   ========================================== */

// ==================== 分类数据 ====================
const EXPENSE_CATEGORIES = [
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

const INCOME_CATEGORIES = [
    {
        id: 'salary', name: '工资收入', icon: '💼',
        sub: ['月薪', '年终奖', '加班费', '奖金', '补贴']
    },
    {
        id: 'gift', name: '红包礼金', icon: '🧧',
        sub: ['节日红包', '生日红包', '婚礼礼金', '压岁钱']
    },
    {
        id: 'investment', name: '投资理财', icon: '💰',
        sub: ['利息收入', '股息分红', '基金收益', '股票收益', '理财产品']
    },
    {
        id: 'refund', name: '退款报销', icon: '🔄',
        sub: ['购物退款', '报销款', '押金退回']
    },
    {
        id: 'rental', name: '租赁收入', icon: '🏠',
        sub: ['房租收入', '设备租赁']
    },
    {
        id: 'sidejob', name: '兼职副业', icon: '🛠️',
        sub: ['兼职', '自由职业', '咨询费', '稿费']
    },
    {
        id: 'other_income', name: '其他收入', icon: '📦',
        sub: ['其他收入']
    }
];

// 向后兼容：旧变量名
const CATEGORIES = EXPENSE_CATEGORIES;

// 饼图颜色方案
const CHART_COLORS = [
    '#4CAF50', '#FF9800', '#2196F3', '#E91E63', '#9C27B0',
    '#00BCD4', '#FF5722', '#795548', '#607D8B', '#CDDC39',
    '#3F51B5', '#9E9E9E'
];
const INCOME_CHART_COLORS = [
    '#2196F3', '#4CAF50', '#FF9800', '#00BCD4', '#9C27B0',
    '#3F51B5', '#E91E63', '#FF5722', '#795548', '#607D8B',
    '#CDDC39', '#9E9E9E'
];

// ==================== 应用状态 ====================
const STORAGE_KEY = 'xiaozhangben_records';
const OLD_STORAGE_KEY = 'xiaozhangben_expenses';

let state = {
    currentPage: 'home',
    // 记账页临时状态
    addType: 'expense',      // 'expense' | 'income'
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

/** 尝试从旧 key 迁移数据 */
function migrateOldData() {
    try {
        const oldRaw = localStorage.getItem(OLD_STORAGE_KEY);
        if (oldRaw) {
            const oldRecords = JSON.parse(oldRaw);
            oldRecords.forEach(r => { if (!r.type) r.type = 'expense'; });
            localStorage.setItem(STORAGE_KEY, JSON.stringify(oldRecords));
            localStorage.removeItem(OLD_STORAGE_KEY);
            return oldRecords;
        }
    } catch (e) { /* 忽略迁移错误 */ }
    return null;
}

migrateOldData();

/** 从 localStorage 加载所有记录 */
function loadRecords() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const records = raw ? JSON.parse(raw) : [];
        // 向后兼容：旧数据没有 type 字段，默认设为 'expense'
        let migrated = false;
        records.forEach(r => {
            if (!r.type) { r.type = 'expense'; migrated = true; }
        });
        if (migrated) {
            saveRecordsRaw(records);
        }
        return records;
    } catch (e) {
        console.error('数据加载失败:', e);
        return [];
    }
}

/** 保存所有记录到 localStorage（不触发额外操作） */
function saveRecordsRaw(records) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch (e) {
        console.error('数据保存失败:', e);
        showToast('⚠️ 保存失败，请检查浏览器存储空间');
    }
}

/** 添加一条记录 */
function addRecord(type, amount, category1, category2, date, note) {
    const records = loadRecords();
    const now = new Date();
    const record = {
        id: generateId(),
        type: type,                  // 'expense' | 'income'
        amount: parseFloat(amount),
        category1: category1,
        category2: category2,
        date: date,
        time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
        note: note || '',
        createdAt: now.toISOString(),
    };
    records.unshift(record);
    saveRecordsRaw(records);
    return record;
}

/** 删除一条记录 */
function deleteRecord(id) {
    const records = loadRecords();
    const filtered = records.filter(e => e.id !== id);
    saveRecordsRaw(filtered);
}

// 向后兼容：旧函数名
function loadExpenses() { return loadRecords(); }
function deleteExpense(id) { deleteRecord(id); }

// ==================== 工具函数 ====================

function generateId() {
    const ts = Date.now().toString(36);
    const rand = Math.random().toString(36).substring(2, 8);
    return `${ts}_${rand}`;
}

function formatAmount(amount) {
    return '¥ ' + Math.abs(amount).toFixed(2);
}

function formatAmountSigned(amount, type) {
    const sign = type === 'income' ? '+' : '-';
    return sign + '¥ ' + Math.abs(amount).toFixed(2);
}

function getMonthKey(date) {
    const d = date || new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getTodayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatMonth(monthKey) {
    const [y, m] = monthKey.split('-');
    return `${y}年${parseInt(m)}月`;
}

function formatDate(dateStr) {
    const d = new Date(dateStr);
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return `${d.getMonth() + 1}月${d.getDate()}日 ${weekDays[d.getDay()]}`;
}

function getCategoryIcon(category1Name) {
    let cat = EXPENSE_CATEGORIES.find(c => c.name === category1Name);
    if (cat) return cat.icon;
    cat = INCOME_CATEGORIES.find(c => c.name === category1Name);
    return cat ? cat.icon : '📦';
}

function getCategories(type) {
    return type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
}

// ==================== Toast & 对话框 ====================

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

        function onCancel() { cleanup(); resolve(false); }
        function onOk() { cleanup(); resolve(true); }

        cancelBtn.addEventListener('click', onCancel);
        okBtn.addEventListener('click', onOk);
    });
}

// ==================== 页面导航 ====================

function switchPage(pageName) {
    // 离开游戏页时停止游戏
    if (state.currentPage === 'game' && pageName !== 'game') {
        stopSnakeGame();
    }

    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${pageName}`).classList.add('active');

    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`.nav-btn[data-page="${pageName}"]`).classList.add('active');

    state.currentPage = pageName;

    switch (pageName) {
        case 'home': renderHome(); break;
        case 'add': resetAddPage(); break;
        case 'records': renderRecords(); break;
        case 'stats': renderStats(); break;
        case 'game': initSnakeGame(); break;
    }
}

// ==================== 首页 ====================

function renderHome() {
    const now = new Date();
    const monthKey = getMonthKey(now);
    const todayKey = getTodayKey();
    const records = loadRecords();

    // 更新头部月份
    document.getElementById('header-month').textContent = formatMonth(monthKey);

    // 本月收入/支出
    const monthlyIncome = records.filter(e => e.date.startsWith(monthKey) && e.type === 'income');
    const monthlyExpense = records.filter(e => e.date.startsWith(monthKey) && e.type === 'expense');
    const incomeTotal = monthlyIncome.reduce((sum, e) => sum + e.amount, 0);
    const expenseTotal = monthlyExpense.reduce((sum, e) => sum + e.amount, 0);
    const balance = incomeTotal - expenseTotal;

    // 更新收入/支出/结余卡片
    document.getElementById('monthly-income').textContent = formatAmount(incomeTotal);
    document.getElementById('monthly-expense').textContent = formatAmount(expenseTotal);
    const balanceEl = document.getElementById('monthly-balance');
    balanceEl.textContent = (balance >= 0 ? '+' : '') + formatAmount(balance);
    balanceEl.className = 'summary-balance ' + (balance >= 0 ? 'positive' : 'negative');

    // 今日收入/支出
    const todayIncome = records.filter(e => e.date === todayKey && e.type === 'income');
    const todayExpense = records.filter(e => e.date === todayKey && e.type === 'expense');
    document.getElementById('today-income').textContent = formatAmount(todayIncome.reduce((s, e) => s + e.amount, 0));
    document.getElementById('today-expense').textContent = formatAmount(todayExpense.reduce((s, e) => s + e.amount, 0));

    // 最近5条记录
    const recentList = document.getElementById('recent-list');
    const recent = records.slice(0, 5);

    if (recent.length === 0) {
        recentList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📝</div>
                <div>还没有记账哦</div>
                <div class="empty-hint">点击下方 ✏️记账 开始吧！</div>
            </div>`;
    } else {
        recentList.innerHTML = recent.map(e => {
            const isIncome = e.type === 'income';
            const sign = isIncome ? '+' : '-';
            const cls = isIncome ? 'income' : 'expense';
            return `
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
                <div class="record-amount ${cls}">${sign}${e.amount.toFixed(2)}</div>
            </div>`;
        }).join('');
    }
}

// ==================== 记账页 ====================

function resetAddPage() {
    state.addAmount = '0';
    state.addCategory1 = null;
    state.addCategory2 = null;
    updateTypeToggleUI();
    updateAmountDisplay();
    renderCategory1Grid();
    renderCategory2Row();
    document.getElementById('expense-date').value = getTodayKey();
    document.getElementById('expense-note').value = '';
    document.getElementById('save-btn').disabled = true;
}

/** 切换收入/支出类型 */
function switchAddType(type) {
    state.addType = type;
    state.addCategory1 = null;
    state.addCategory2 = null;
    updateTypeToggleUI();
    renderCategory1Grid();
    renderCategory2Row();
    updateSaveButton();
}

/** 更新类型切换按钮 UI */
function updateTypeToggleUI() {
    const expenseBtn = document.getElementById('type-toggle-expense');
    const incomeBtn = document.getElementById('type-toggle-income');
    const saveBtn = document.getElementById('save-btn');

    if (state.addType === 'expense') {
        expenseBtn.classList.add('active');
        incomeBtn.classList.remove('active');
    } else {
        incomeBtn.classList.add('active');
        expenseBtn.classList.remove('active');
    }

    // 保存按钮颜色
    if (state.addType === 'income') {
        saveBtn.classList.add('income-btn');
    } else {
        saveBtn.classList.remove('income-btn');
    }
}

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

function handleNumpadKey(key) {
    let current = state.addAmount;
    const MAX_INT_LENGTH = 8;
    const MAX_DECIMAL = 2;

    if (key === 'del') {
        if (current.length <= 1 || current === '0') {
            current = '0';
        } else {
            current = current.substring(0, current.length - 1);
        }
    } else if (key === '.') {
        if (current.includes('.')) return;
        if (current === '0' || current === '') {
            current = '0.';
        } else {
            current += '.';
        }
    } else {
        if (current === '0') {
            current = key;
        } else {
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

function renderCategory1Grid() {
    const grid = document.getElementById('category1-grid');
    const categories = getCategories(state.addType);

    grid.innerHTML = categories.map((cat, index) => `
        <div class="category1-item${state.addCategory1 === index ? ' selected' : ''}"
             data-index="${index}">
            <span class="category1-icon">${cat.icon}</span>
            <span class="category1-name">${cat.name}</span>
        </div>
    `).join('');

    grid.querySelectorAll('.category1-item').forEach(item => {
        item.addEventListener('click', () => {
            selectCategory1(parseInt(item.dataset.index));
        });
    });
}

function selectCategory1(index) {
    if (state.addCategory1 === index) {
        state.addCategory1 = null;
        state.addCategory2 = null;
    } else {
        state.addCategory1 = index;
        state.addCategory2 = null;
    }
    renderCategory1Grid();
    renderCategory2Row();
    updateSaveButton();
}

function renderCategory2Row() {
    const row = document.getElementById('category2-row');

    if (state.addCategory1 === null) {
        row.innerHTML = '<span style="font-size:13px;color:#CCC;">请先选择一级分类</span>';
        return;
    }

    const categories = getCategories(state.addType);
    const cat = categories[state.addCategory1];
    row.innerHTML = cat.sub.map(sub => `
        <span class="category2-tag${state.addCategory2 === sub ? ' selected' : ''}"
              data-sub="${sub}">${sub}</span>
    `).join('');

    row.querySelectorAll('.category2-tag').forEach(tag => {
        tag.addEventListener('click', () => {
            selectCategory2(tag.dataset.sub);
        });
    });
}

function selectCategory2(subName) {
    if (state.addCategory2 === subName) {
        state.addCategory2 = null;
    } else {
        state.addCategory2 = subName;
    }
    renderCategory2Row();
    updateSaveButton();
}

function updateSaveButton() {
    const btn = document.getElementById('save-btn');
    const amount = parseFloat(state.addAmount);
    const valid = amount > 0 && state.addCategory1 !== null && state.addCategory2 !== null;
    btn.disabled = !valid;
}

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

    const categories = getCategories(state.addType);
    const category1 = categories[state.addCategory1].name;
    const date = document.getElementById('expense-date').value || getTodayKey();
    const note = document.getElementById('expense-note').value.trim();

    addRecord(state.addType, amount.toFixed(2), category1, state.addCategory2, date, note);

    const label = state.addType === 'income' ? '收入' : '支出';
    showToast(`✅ ${label}记录成功！`);
    resetAddPage();
}

// ==================== 账单页 ====================

function initRecordsMonth() {
    if (!state.recordsMonth) {
        state.recordsMonth = getMonthKey();
    }
}

function renderRecords() {
    initRecordsMonth();
    document.getElementById('records-month').textContent = formatMonth(state.recordsMonth);
    renderFilterRow();
    renderRecordsList();
}

function renderFilterRow() {
    const filterRow = document.getElementById('filter-row');
    const allExpense = { key: 'all_expense', label: '📉 全部支出' };
    const allIncome = { key: 'all_income', label: '📈 全部收入' };

    const filters = [
        { key: 'all', label: '全部' },
        allExpense,
        ...EXPENSE_CATEGORIES.map(c => ({ key: 'expense:' + c.name, label: c.icon + ' ' + c.name })),
        allIncome,
        ...INCOME_CATEGORIES.map(c => ({ key: 'income:' + c.name, label: c.icon + ' ' + c.name })),
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

function renderRecordsList() {
    const list = document.getElementById('records-list');
    const totalEl = document.getElementById('records-total-amount');
    const records = loadRecords();

    // 按月份筛选
    let filtered = records.filter(e => e.date.startsWith(state.recordsMonth));

    // 按分类筛选
    const filter = state.recordsFilter;
    if (filter === 'all_expense') {
        filtered = filtered.filter(e => e.type === 'expense');
    } else if (filter === 'all_income') {
        filtered = filtered.filter(e => e.type === 'income');
    } else if (filter.startsWith('expense:')) {
        const catName = filter.substring(8);
        filtered = filtered.filter(e => e.type === 'expense' && e.category1 === catName);
    } else if (filter.startsWith('income:')) {
        const catName = filter.substring(7);
        filtered = filtered.filter(e => e.type === 'income' && e.category1 === catName);
    } else if (filter !== 'all') {
        filtered = filtered.filter(e => e.category1 === filter);
    }

    // 计算合计（分离收入支出）
    const expenseTotal = filtered.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
    const incomeTotal = filtered.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);
    if (expenseTotal > 0 && incomeTotal > 0) {
        totalEl.innerHTML = `支出 <span style="color:#F44336">${formatAmount(expenseTotal)}</span> | 收入 <span style="color:#4CAF50">${formatAmount(incomeTotal)}</span>`;
    } else if (incomeTotal > 0) {
        totalEl.innerHTML = `收入合计：<span style="color:#4CAF50">${formatAmount(incomeTotal)}</span>`;
    } else {
        totalEl.innerHTML = `支出合计：<span style="color:#F44336">${formatAmount(expenseTotal)}</span>`;
    }

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

    const dates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

    let html = '';
    dates.forEach(date => {
        html += `<div class="date-group-header">📅 ${formatDate(date)}</div>`;
        grouped[date].forEach(e => {
            const isIncome = e.type === 'income';
            const sign = isIncome ? '+' : '-';
            const cls = isIncome ? 'income' : 'expense';
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
                    <div class="record-amount ${cls}">${sign}${e.amount.toFixed(2)}</div>
                    <button class="record-delete" data-id="${e.id}" title="删除">🗑️</button>
                </div>
            `;
        });
    });

    list.innerHTML = html;

    list.querySelectorAll('.record-delete').forEach(btn => {
        btn.addEventListener('click', async (evt) => {
            evt.stopPropagation();
            const id = btn.dataset.id;
            const confirmed = await showConfirm('确定要删除这条记录吗？删除后无法恢复。');
            if (confirmed) {
                deleteRecord(id);
                showToast('🗑️ 已删除');
                renderRecords();
            }
        });
    });
}

function changeMonth(delta) {
    const [y, m] = state.recordsMonth.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    state.recordsMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    renderRecords();
}

// ==================== 统计页 ====================

function renderStats() {
    const monthKey = state.recordsMonth || getMonthKey();
    const records = loadRecords();

    // 更新月份显示
    document.getElementById('stats-month').textContent = formatMonth(monthKey);

    // 筛选当月数据
    const monthly = records.filter(e => e.date.startsWith(monthKey));
    const monthlyIncome = monthly.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);
    const monthlyExpense = monthly.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
    const balance = monthlyIncome - monthlyExpense;

    // 收入/支出/结余概览
    document.getElementById('stats-income').textContent = formatAmount(monthlyIncome);
    document.getElementById('stats-expense').textContent = formatAmount(monthlyExpense);
    const balEl = document.getElementById('stats-balance');
    balEl.textContent = (balance >= 0 ? '+' : '') + formatAmount(balance);
    balEl.className = 'stats-balance-value ' + (balance >= 0 ? 'positive' : 'negative');

    // 支出饼图
    renderPieSection('expense-chart-container', 'expense-legend', 'expense-ranking',
        monthly.filter(e => e.type === 'expense'), 'expense');

    // 收入饼图
    renderPieSection('income-chart-container', 'income-legend', 'income-ranking',
        monthly.filter(e => e.type === 'income'), 'income');
}

function renderPieSection(containerId, legendId, rankingId, records, type) {
    const container = document.getElementById(containerId);

    if (records.length === 0) {
        const label = type === 'income' ? '收入' : '支出';
        container.innerHTML = `<div class="empty-state"><div class="empty-icon">📊</div><div>本月暂无${label}数据</div></div>`;
        document.getElementById(rankingId).innerHTML = '';
        return;
    }

    // 按一级分类汇总
    const categorySum = {};
    records.forEach(e => {
        if (!categorySum[e.category1]) categorySum[e.category1] = 0;
        categorySum[e.category1] += e.amount;
    });

    const total = records.reduce((sum, e) => sum + e.amount, 0);
    const sorted = Object.entries(categorySum).sort((a, b) => b[1] - a[1]);

    // 恢复容器结构
    container.innerHTML = `
        <canvas width="280" height="280"></canvas>
        <div class="chart-legend" id="${legendId}"></div>
    `;

    const canvas = container.querySelector('canvas');
    const legendEl = document.getElementById(legendId);
    drawPieChart(canvas, sorted, total, type, legendEl);

    // 排行榜
    const rankList = document.getElementById(rankingId);
    rankList.innerHTML = sorted.map((entry, i) => {
        const [name, amount] = entry;
        const percent = ((amount / total) * 100).toFixed(1);
        let rankClass = 'normal', rankIcon = (i + 1).toString();
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

function drawPieChart(canvas, sortedData, total, type, legendEl) {
    const ctx = canvas.getContext('2d');
    const cx = 140, cy = 140, radius = 110;
    const colors = type === 'income' ? INCOME_CHART_COLORS : CHART_COLORS;

    ctx.clearRect(0, 0, 280, 280);

    let startAngle = -Math.PI / 2;

    sortedData.forEach((entry, i) => {
        const [name, amount] = entry;
        const sliceAngle = (amount / total) * Math.PI * 2;
        const color = colors[i % colors.length];

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, radius, startAngle, startAngle + sliceAngle);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        const percent = ((amount / total) * 100).toFixed(1);
        if (parseFloat(percent) >= 5) {
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

    // 中间甜甜圈
    ctx.beginPath();
    ctx.arc(cx, cy, 55, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.strokeStyle = '#F0F0F0';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 中间文字
    const label = type === 'income' ? '总收入' : '总支出';
    ctx.fillStyle = '#333';
    ctx.font = 'bold 14px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, cx, cy - 8);
    ctx.font = 'bold 16px -apple-system, sans-serif';
    ctx.fillText(formatAmount(total), cx, cy + 12);
}

// ==================== 贪吃蛇游戏 ====================

// ╔══════════════════════════════════════════════════════════╗
// ║          🎮 游戏参数配置（修改这里来调整游戏）            ║
// ╚══════════════════════════════════════════════════════════╝

const SNAKE_CONFIG = {
    // ---- 画布 ----
    gridCount: 20,              // 网格数量（20×20），越大格子越小
    maxCanvasSize: 500,         // 画布最大尺寸（像素）

    // ---- 蛇 ----
    snakeStartLength: 3,        // 蛇初始长度
    snakeStartDirX: 1,          // 蛇初始方向 X（1=右, -1=左, 0=不动）
    snakeStartDirY: 0,          // 蛇初始方向 Y（1=下, -1=上, 0=不动）

    // ---- 食物 ----
    foodScore: 10,              // 每吃一个食物加的分数
    speedUpInterval: 50,        // 每增加多少分加一次速（每吃 N 个食物）
    speedUpAmount: 10,          // 每次加速减少的间隔（毫秒），越小变化越平滑
    minSpeed: 40,               // 最快速度限制（毫秒/步），防止快到没法玩

    // ---- 障碍物 ----
    obstacleProtectRadius: 3,   // 蛇出生点周围的保护范围（格子数），障碍物不会生成在这里
    obstacleMaxAttempts: 20,    // 每个障碍物的最大尝试次数倍数（总数×此值=最多尝试次数）

    // ---- 难度预设 ----
    //  格式：{ label: '显示名', obstacleCount: 障碍物数, speed: 移动间隔(毫秒) }
    //  注意：speed 是毫秒/步，值越小蛇越快！
    presets: {
        easy:   { label: '简单', obstacleCount: 8,  speed: 160 },
        normal: { label: '普通', obstacleCount: 20, speed: 120 },
        hard:   { label: '困难', obstacleCount: 40, speed: 80 },
    },

    // ---- 自定义难度默认值 ----
    customDefaultObstacles: 20,  // 自定义障碍物默认数量
    customDefaultSpeedLevel: 5,  // 自定义速度默认等级（1-10）

    // ---- 颜色（可以按喜好修改） ----
    bgColor: '#16213e',               // 画布背景色
    gridColor: 'rgba(255, 255, 255, 0.03)',  // 网格线颜色
    obstacleColor: '#555',            // 障碍物填充色
    obstacleBorder: '#777',           // 障碍物边框色
    obstacleXColor: 'rgba(255,255,255,0.15)',  // 障碍物 X 标记色
    foodColor: '#FF3B30',             // 食物颜色
    foodGlowColor: 'rgba(255, 50, 50, 0.3)',   // 食物光晕颜色
    snakeHeadColor: '#4CAF50',        // 蛇头颜色
    snakeHeadBorder: '#388E3C',       // 蛇头边框色
    snakeEyeColor: '#fff',            // 蛇眼睛颜色
    pauseOverlayColor: 'rgba(0, 0, 0, 0.6)',   // 暂停遮罩颜色
    gameOverOverlayColor: 'rgba(0, 0, 0, 0.75)', // 结束遮罩颜色
};

// 从配置中解构常用值（方便后面直接使用）
const DIFFICULTY_PRESETS = SNAKE_CONFIG.presets;

const SnakeGame = {
    canvas: null,
    ctx: null,
    gridCount: SNAKE_CONFIG.gridCount,
    cellSize: 16,
    snake: [],
    food: { x: 0, y: 0 },
    obstacles: [],            // [{x, y}, ...] 随机障碍物
    direction: { dx: SNAKE_CONFIG.snakeStartDirX, dy: SNAKE_CONFIG.snakeStartDirY },
    nextDirection: { dx: SNAKE_CONFIG.snakeStartDirX, dy: SNAKE_CONFIG.snakeStartDirY },
    score: 0,
    bestScore: 0,
    gameLoopId: null,
    difficulty: 'normal',    // 'easy' | 'normal' | 'hard' | 'custom'
    obstacleCount: SNAKE_CONFIG.customDefaultObstacles,
    baseSpeed: DIFFICULTY_PRESETS.normal.speed,
    speed: DIFFICULTY_PRESETS.normal.speed,
    isRunning: false,
    isPaused: false,
    gameStarted: false,      // 是否已选完难度并开始
    touchStartX: 0,
    touchStartY: 0,

    // ---- 速度等级换算 ----
    //  用户选 1-10 级，等级越高蛇越快（间隔越小）
    //  等级 1 = 200ms/步（慢），等级 10 = 50ms/步（快）
    speedLevelToInterval(level) {
        // 等级 1→200ms, 等级 5→120ms, 等级 10→50ms
        return Math.round(200 - (level - 1) * (150 / 9));
    },

    /** 初始化画布大小和触摸事件（只执行一次，防止重复绑定事件） */
    init() {
        if (this.initialized) return;

        this.canvas = document.getElementById('snake-canvas');
        this.ctx = this.canvas.getContext('2d');

        const container = document.querySelector('.game-container');
        const containerWidth = container.clientWidth - 20;
        const size = Math.min(containerWidth, SNAKE_CONFIG.maxCanvasSize);
        this.canvas.width = size;
        this.canvas.height = size;
        this.cellSize = size / this.gridCount;

        const saved = localStorage.getItem('snake_best_score');
        this.bestScore = saved ? parseInt(saved) : 0;

        this.bindTouchEvents();
        this.bindDifficultyEvents();
        this.bindPauseEvents();

        this.initialized = true;
    },

    /** 绑定难度选择事件 */
    bindDifficultyEvents() {
        const overlay = document.getElementById('difficulty-overlay');
        const customPanel = document.getElementById('custom-settings');
        const obstacleSlider = document.getElementById('custom-obstacles');
        const speedSlider = document.getElementById('custom-speed');
        const customStartBtn = document.getElementById('custom-start-btn');

        // 预设难度按钮
        overlay.querySelectorAll('.difficulty-btn[data-difficulty]').forEach(btn => {
            btn.addEventListener('click', () => {
                const diff = btn.dataset.difficulty;
                if (diff === 'custom') {
                    customPanel.style.display = 'block';
                } else {
                    const preset = DIFFICULTY_PRESETS[diff];
                    this.startWithDifficulty(diff, preset.obstacleCount, preset.speed);
                }
            });
        });

        // 自定义滑块 - 障碍物数量
        obstacleSlider.addEventListener('input', () => {
            document.getElementById('custom-obstacles-val').textContent = obstacleSlider.value + ' 个';
        });

        // 自定义滑块 - 速度等级（1-10级，越高越快）
        speedSlider.addEventListener('input', () => {
            document.getElementById('custom-speed-val').textContent = speedSlider.value + ' 级';
        });

        // 自定义开始按钮
        customStartBtn.addEventListener('click', () => {
            const count = parseInt(obstacleSlider.value);
            const level = parseInt(speedSlider.value);
            const interval = this.speedLevelToInterval(level);
            this.startWithDifficulty('custom', count, interval);
        });
    },

    /** 绑定暂停画面按钮事件 */
    bindPauseEvents() {
        document.getElementById('pause-resume-btn').addEventListener('click', () => {
            this.togglePause();
        });
        document.getElementById('pause-quit-btn').addEventListener('click', () => {
            this.quitGame();
        });
    },

    /** 绑定触摸滑动事件 */
    bindTouchEvents() {
        const canvas = this.canvas;

        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.touchStartX = touch.clientX;
            this.touchStartY = touch.clientY;
        }, { passive: false });

        canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (!this.isRunning || this.isPaused) return;
            const touch = e.changedTouches[0];
            const dx = touch.clientX - this.touchStartX;
            const dy = touch.clientY - this.touchStartY;
            const absDx = Math.abs(dx);
            const absDy = Math.abs(dy);

            if (Math.max(absDx, absDy) < 20) return;

            if (absDx > absDy) {
                this.setDirection(dx > 0 ? 1 : -1, 0);
            } else {
                this.setDirection(0, dy > 0 ? 1 : -1);
            }
        }, { passive: false });
    },

    /** 显示难度选择界面 */
    showDifficultyScreen() {
        this.gameStarted = false;
        this.isRunning = false;
        this.isPaused = false;
        this.snake = [];
        this.obstacles = [];
        if (this.gameLoopId) {
            clearInterval(this.gameLoopId);
            this.gameLoopId = null;
        }
        document.getElementById('difficulty-overlay').classList.remove('hidden');
        document.getElementById('game-over-overlay').classList.remove('show');
        document.getElementById('pause-overlay').classList.remove('show');
        document.getElementById('custom-settings').style.display = 'none';
        document.getElementById('snake-score').textContent = '0';
        this.draw();
    },

    /** 以指定难度开始游戏 */
    startWithDifficulty(difficulty, obstacleCount, speed) {
        this.difficulty = difficulty;
        this.obstacleCount = obstacleCount;
        this.baseSpeed = speed;
        this.speed = speed;

        document.getElementById('difficulty-overlay').classList.add('hidden');
        document.getElementById('custom-settings').style.display = 'none';

        this.reset();
        this.gameStarted = true;
        this.isRunning = true;
        this.isPaused = false;

        if (this.gameLoopId) clearInterval(this.gameLoopId);
        this.gameLoopId = setInterval(() => this.update(), this.speed);

        this.draw();
    },

    /** 通用开始（由外部调用时默认显示难度选择） */
    start() {
        this.showDifficultyScreen();
    },

    /** 重置状态 */
    reset() {
        this.direction = { dx: SNAKE_CONFIG.snakeStartDirX, dy: SNAKE_CONFIG.snakeStartDirY };
        this.nextDirection = { dx: SNAKE_CONFIG.snakeStartDirX, dy: SNAKE_CONFIG.snakeStartDirY };
        this.score = 0;
        this.speed = this.baseSpeed;

        // 蛇初始位置：中间偏左
        const mid = Math.floor(this.gridCount / 2);
        this.snake = [];
        for (let i = 0; i < SNAKE_CONFIG.snakeStartLength; i++) {
            this.snake.push({ x: mid - i, y: mid });
        }

        this.food = { x: 0, y: 0 };
        this.spawnFood();
        this.spawnObstacles();
        document.getElementById('snake-score').textContent = '0';
    },

    /** 停止游戏 */
    stop() {
        this.isRunning = false;
        this.gameStarted = false;
        if (this.gameLoopId) {
            clearInterval(this.gameLoopId);
            this.gameLoopId = null;
        }
    },

    /** 切换暂停/继续 */
    togglePause() {
        if (!this.isRunning) return;
        this.isPaused = !this.isPaused;
        if (this.isPaused) {
            document.getElementById('pause-overlay').classList.add('show');
        } else {
            document.getElementById('pause-overlay').classList.remove('show');
        }
        this.draw();
    },

    /** 退出当前游戏，返回难度选择 */
    quitGame() {
        document.getElementById('pause-overlay').classList.remove('show');
        this.showDifficultyScreen();
    },

    /** 设置方向（防止反向） */
    setDirection(dx, dy) {
        if (dx + this.direction.dx === 0 && dy + this.direction.dy === 0) return;
        this.nextDirection = { dx, dy };
    },

    /** 生成食物（避开蛇身和障碍物） */
    spawnFood() {
        const occupied = new Set([
            ...this.snake.map(s => `${s.x},${s.y}`),
            ...this.obstacles.map(o => `${o.x},${o.y}`),
        ]);
        const empty = [];
        for (let x = 0; x < this.gridCount; x++) {
            for (let y = 0; y < this.gridCount; y++) {
                if (!occupied.has(`${x},${y}`)) {
                    empty.push({ x, y });
                }
            }
        }
        if (empty.length > 0) {
            this.food = empty[Math.floor(Math.random() * empty.length)];
        }
    },

    /** 生成随机障碍物 */
    spawnObstacles() {
        this.obstacles = [];
        const mid = Math.floor(this.gridCount / 2);
        const radius = SNAKE_CONFIG.obstacleProtectRadius;

        // 保护区域：蛇出生点周围 + 蛇身
        const protected_ = new Set(this.snake.map(s => `${s.x},${s.y}`));
        for (let dx = -radius; dx <= radius; dx++) {
            for (let dy = -radius; dy <= radius; dy++) {
                const nx = mid + dx;
                const ny = mid + dy;
                if (nx >= 0 && nx < this.gridCount && ny >= 0 && ny < this.gridCount) {
                    protected_.add(`${nx},${ny}`);
                }
            }
        }

        let placed = 0;
        const maxAttempts = this.obstacleCount * SNAKE_CONFIG.obstacleMaxAttempts;
        let attempts = 0;

        while (placed < this.obstacleCount && attempts < maxAttempts) {
            const x = Math.floor(Math.random() * this.gridCount);
            const y = Math.floor(Math.random() * this.gridCount);
            const key = `${x},${y}`;

            if (!protected_.has(key)) {
                this.obstacles.push({ x, y });
                protected_.add(key);
                placed++;
            }
            attempts++;
        }
    },

    /** 每步更新游戏状态 */
    update() {
        if (this.isPaused) return;

        this.direction = { ...this.nextDirection };

        const head = this.snake[0];
        let newHead = {
            x: head.x + this.direction.dx,
            y: head.y + this.direction.dy,
        };

        // 🌐 穿墙：从另一侧穿出
        if (newHead.x < 0) newHead.x = this.gridCount - 1;
        if (newHead.x >= this.gridCount) newHead.x = 0;
        if (newHead.y < 0) newHead.y = this.gridCount - 1;
        if (newHead.y >= this.gridCount) newHead.y = 0;

        // 检查撞自己
        if (this.snake.some(s => s.x === newHead.x && s.y === newHead.y)) {
            return this.handleGameOver();
        }

        // 🧱 检查撞障碍物
        if (this.obstacles.some(o => o.x === newHead.x && o.y === newHead.y)) {
            return this.handleGameOver();
        }

        this.snake.unshift(newHead);

        // 吃到食物
        if (newHead.x === this.food.x && newHead.y === this.food.y) {
            this.score += SNAKE_CONFIG.foodScore;
            document.getElementById('snake-score').textContent = this.score;
            this.spawnFood();
            // 每吃一定分数加速
            if (this.score % SNAKE_CONFIG.speedUpInterval === 0 && this.speed > SNAKE_CONFIG.minSpeed) {
                this.speed -= SNAKE_CONFIG.speedUpAmount;
                clearInterval(this.gameLoopId);
                this.gameLoopId = setInterval(() => this.update(), this.speed);
            }
        } else {
            this.snake.pop();
        }

        this.draw();
    },

    /** 游戏结束处理 */
    handleGameOver() {
        this.stop();
        document.getElementById('pause-overlay').classList.remove('show');

        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('snake_best_score', this.bestScore);
        }

        const diffLabel = DIFFICULTY_PRESETS[this.difficulty]
            ? DIFFICULTY_PRESETS[this.difficulty].label
            : '自定义';
        document.getElementById('game-over-score').textContent =
            `${this.score} 分（${diffLabel} · 🏆最高 ${this.bestScore}）`;
        document.getElementById('game-over-overlay').classList.add('show');
    },

    /** 绘制画布 */
    draw() {
        const { ctx, canvas, cellSize, gridCount, snake, food, obstacles } = this;
        const C = SNAKE_CONFIG;

        // 背景
        ctx.fillStyle = C.bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 网格线
        ctx.strokeStyle = C.gridColor;
        ctx.lineWidth = 0.5;
        for (let i = 0; i <= gridCount; i++) {
            const pos = i * cellSize;
            ctx.beginPath();
            ctx.moveTo(pos, 0); ctx.lineTo(pos, canvas.height); ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, pos); ctx.lineTo(canvas.width, pos); ctx.stroke();
        }

        // 🧱 绘制障碍物
        obstacles.forEach(obs => {
            const x = obs.x * cellSize;
            const y = obs.y * cellSize;
            const pad = 2;
            ctx.fillStyle = C.obstacleColor;
            ctx.fillRect(x + pad, y + pad, cellSize - pad * 2, cellSize - pad * 2);
            ctx.strokeStyle = C.obstacleBorder;
            ctx.lineWidth = 1;
            ctx.strokeRect(x + pad, y + pad, cellSize - pad * 2, cellSize - pad * 2);
            ctx.strokeStyle = C.obstacleXColor;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(x + pad + 3, y + pad + 3);
            ctx.lineTo(x + cellSize - pad - 3, y + cellSize - pad - 3);
            ctx.moveTo(x + cellSize - pad - 3, y + pad + 3);
            ctx.lineTo(x + pad + 3, y + cellSize - pad - 3);
            ctx.stroke();
        });

        // 绘制食物
        const foodX = food.x * cellSize + cellSize / 2;
        const foodY = food.y * cellSize + cellSize / 2;
        const foodR = cellSize * 0.4;

        ctx.beginPath();
        ctx.arc(foodX, foodY, foodR + 3, 0, Math.PI * 2);
        ctx.fillStyle = C.foodGlowColor;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(foodX, foodY, foodR, 0, Math.PI * 2);
        ctx.fillStyle = C.foodColor;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(foodX - foodR * 0.25, foodY - foodR * 0.25, foodR * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fill();

        // 绘制蛇
        snake.forEach((seg, i) => {
            const x = seg.x * cellSize;
            const y = seg.y * cellSize;
            const pad = 1;

            if (i === 0) {
                const headR = cellSize / 2 - pad;
                ctx.beginPath();
                ctx.arc(x + cellSize / 2, y + cellSize / 2, headR, 0, Math.PI * 2);
                ctx.fillStyle = C.snakeHeadColor;
                ctx.fill();
                ctx.strokeStyle = C.snakeHeadBorder;
                ctx.lineWidth = 1.5;
                ctx.stroke();

                // 眼睛
                const eyeR = cellSize * 0.12;
                let eye1X, eye1Y, eye2X, eye2Y;
                const cx = x + cellSize / 2;
                const cy = y + cellSize / 2;
                const offset = cellSize * 0.22;

                if (this.direction.dx === 1) {
                    eye1X = cx + offset; eye1Y = cy - offset;
                    eye2X = cx + offset; eye2Y = cy + offset;
                } else if (this.direction.dx === -1) {
                    eye1X = cx - offset; eye1Y = cy - offset;
                    eye2X = cx - offset; eye2Y = cy + offset;
                } else if (this.direction.dy === -1) {
                    eye1X = cx - offset; eye1Y = cy - offset;
                    eye2X = cx + offset; eye2Y = cy - offset;
                } else {
                    eye1X = cx - offset; eye1Y = cy + offset;
                    eye2X = cx + offset; eye2Y = cy + offset;
                }

                ctx.beginPath();
                ctx.arc(eye1X, eye1Y, eyeR, 0, Math.PI * 2);
                ctx.fillStyle = C.snakeEyeColor; ctx.fill();
                ctx.beginPath();
                ctx.arc(eye2X, eye2Y, eyeR, 0, Math.PI * 2);
                ctx.fillStyle = C.snakeEyeColor; ctx.fill();
            } else {
                const ratio = i / Math.max(snake.length - 1, 1);
                const g = Math.floor(180 - ratio * 80);
                const r = Math.floor(30 + ratio * 30);
                ctx.fillStyle = `rgb(${r}, ${g}, 80)`;

                const bodyR = cellSize / 2 - pad - 1;
                ctx.beginPath();
                ctx.arc(x + cellSize / 2, y + cellSize / 2, bodyR, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    },
};

/** 贪吃蛇页面初始化（每次进入游戏Tab时调用） */
function initSnakeGame() {
    SnakeGame.init();
    SnakeGame.start();
}

/** 贪吃蛇页面清理（离开时调用） */
function stopSnakeGame() {
    SnakeGame.stop();
    document.getElementById('pause-overlay').classList.remove('show');
}

// ==================== 贪吃蛇键盘事件 ====================

document.addEventListener('keydown', (evt) => {
    if (state.currentPage !== 'game') return;
    if (!SnakeGame.gameStarted || !SnakeGame.isRunning || SnakeGame.isPaused) return;

    const key = evt.key.toLowerCase();

    switch (key) {
        case 'arrowup':
        case 'w':
            evt.preventDefault();
            SnakeGame.setDirection(0, -1);
            break;
        case 'arrowdown':
        case 's':
            evt.preventDefault();
            SnakeGame.setDirection(0, 1);
            break;
        case 'arrowleft':
        case 'a':
            evt.preventDefault();
            SnakeGame.setDirection(-1, 0);
            break;
        case 'arrowright':
        case 'd':
            evt.preventDefault();
            SnakeGame.setDirection(1, 0);
            break;
        case ' ':
            evt.preventDefault();
            SnakeGame.togglePause();
            break;
    }
});

// 重新开始按钮事件 — 返回难度选择
document.getElementById('game-restart-btn').addEventListener('click', () => {
    SnakeGame.showDifficultyScreen();
});

// ==================== 事件绑定 ====================

document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        switchPage(btn.dataset.page);
    });
});

document.querySelectorAll('.numpad-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        handleNumpadKey(btn.dataset.key);
    });
});

// 收入/支出类型切换
document.getElementById('type-toggle-expense').addEventListener('click', () => switchAddType('expense'));
document.getElementById('type-toggle-income').addEventListener('click', () => switchAddType('income'));

document.getElementById('save-btn').addEventListener('click', handleSave);

document.getElementById('month-prev').addEventListener('click', () => changeMonth(-1));
document.getElementById('month-next').addEventListener('click', () => changeMonth(1));

document.getElementById('expense-date').value = getTodayKey();

// 键盘支持（桌面端）
document.addEventListener('keydown', (evt) => {
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
    state.recordsMonth = getMonthKey();
}

init();
