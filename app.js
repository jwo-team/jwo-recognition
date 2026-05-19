// ===== JWO Team Recognition App =====
// Shared database: https://api.npoint.io/8055ba6f3970bd5abb93

const NPOINT_URL = 'https://api.npoint.io/8055ba6f3970bd5abb93';

// Default team behaviors
const DEFAULT_VALUES = [
    { id: 'ruthlessly-simplify', name: 'Ruthlessly Simplify to Meet Customer Needs', emoji: '🎯' },
    { id: 'collaborate-root-causes', name: 'Collaborate Across Teams to Solve Root Causes Fast', emoji: '🤝' },
    { id: 'persist-through-no', name: 'Persist Through "No" and Build the Case for "Yes"', emoji: '💪' }
];

// ===== Cloud Data Store =====
class DataStore {
    constructor() {
        this.data = { nominations: [], newsletters: [], values: [] };
        this.loaded = false;
    }

    async load() {
        try {
            const response = await fetch(NPOINT_URL);
            this.data = await response.json();
            if (!this.data.nominations) this.data.nominations = [];
            if (!this.data.newsletters) this.data.newsletters = [];
            if (!this.data.values || this.data.values.length === 0) {
                this.data.values = DEFAULT_VALUES;
                await this.save();
            }
            this.loaded = true;
        } catch (err) {
            console.error('Failed to load data:', err);
            this.data = { nominations: [], newsletters: [], values: DEFAULT_VALUES };
            this.loaded = true;
        }
    }

    async save() {
        try {
            await fetch(NPOINT_URL, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.data)
            });
        } catch (err) {
            console.error('Failed to save data:', err);
            showToast('Error saving — please try again', 'error');
        }
    }

    getValues() {
        return this.data.values || [];
    }

    setValues(values) {
        this.data.values = values;
        this.load().then(() => {
            this.data.values = values;
            this.save();
        });
    }

    getNominations() {
        return this.data.nominations || [];
    }

    async addNomination(nomination) {
        // Always fetch latest data before adding to prevent overwrites
        await this.load();
        nomination.id = Date.now().toString();
        nomination.timestamp = new Date().toISOString();
        this.data.nominations.push(nomination);
        await this.save();
        return nomination;
    }

    async deleteNomination(id) {
        await this.load();
        this.data.nominations = this.data.nominations.filter(n => n.id !== id);
        await this.save();
    }

    getNewsletters() {
        return this.data.newsletters || [];
    }

    async addNewsletter(newsletter) {
        await this.load();
        newsletter.id = Date.now().toString();
        newsletter.savedAt = new Date().toISOString();
        this.data.newsletters.push(newsletter);
        await this.save();
        return newsletter;
    }

    exportAll() {
        return {
            ...this.data,
            exportedAt: new Date().toISOString()
        };
    }

    async importAll(data) {
        if (data.values) this.data.values = data.values;
        if (data.nominations) this.data.nominations = data.nominations;
        if (data.newsletters) this.data.newsletters = data.newsletters;
        await this.save();
    }
}

// ===== Fireworks =====
class Fireworks {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.animating = false;
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    launch() {
        this.animating = true;
        const burstCount = 8;
        for (let i = 0; i < burstCount; i++) {
            setTimeout(() => {
                this.createBurst(
                    Math.random() * this.canvas.width,
                    Math.random() * this.canvas.height * 0.6 + 50
                );
            }, i * 200);
        }
        this.animate();
        setTimeout(() => { this.animating = false; }, 3000);
    }

    createBurst(x, y) {
        const colors = ['#FF9900', '#FFB84D', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96E6A1', '#DDA0DD', '#F7DC6F'];
        const particleCount = 40;
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const speed = 2 + Math.random() * 4;
            const size = 2 + Math.random() * 3;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size, color: colors[Math.floor(Math.random() * colors.length)],
                alpha: 1, decay: 0.015 + Math.random() * 0.01,
                gravity: 0.05,
                shape: Math.random() > 0.5 ? 'circle' : 'star'
            });
        }
    }

    animate() {
        if (!this.animating && this.particles.length === 0) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.particles = this.particles.filter(p => {
            p.x += p.vx; p.y += p.vy; p.vy += p.gravity; p.vx *= 0.99; p.alpha -= p.decay;
            if (p.alpha <= 0) return false;
            this.ctx.save();
            this.ctx.globalAlpha = p.alpha;
            this.ctx.fillStyle = p.color;
            if (p.shape === 'star') { this.drawStar(p.x, p.y, p.size); }
            else { this.ctx.beginPath(); this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); this.ctx.fill(); }
            this.ctx.restore();
            return true;
        });
        requestAnimationFrame(() => this.animate());
    }

    drawStar(x, y, size) {
        this.ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
            const method = i === 0 ? 'moveTo' : 'lineTo';
            this.ctx[method](x + Math.cos(angle) * size, y + Math.sin(angle) * size);
        }
        this.ctx.closePath();
        this.ctx.fill();
    }
}

// ===== Utility Functions =====
function getWeekRange(date = new Date()) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return { start: monday, end: sunday, label: `${formatDate(monday)} - ${formatDate(sunday)}` };
}

function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getNominationsForWeek(nominations, weekStart) {
    const start = new Date(weekStart);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return nominations.filter(n => {
        const nDate = new Date(n.timestamp);
        return nDate >= start && nDate < end;
    });
}

function getAvailableWeeks(nominations) {
    const weeks = new Map();
    nominations.forEach(n => {
        const date = new Date(n.timestamp);
        const weekRange = getWeekRange(date);
        const key = weekRange.start.toISOString().split('T')[0];
        if (!weeks.has(key)) weeks.set(key, weekRange.label);
    });
    const currentWeek = getWeekRange();
    const currentKey = currentWeek.start.toISOString().split('T')[0];
    if (!weeks.has(currentKey)) weeks.set(currentKey, currentWeek.label);
    return Array.from(weeks.entries()).sort((a, b) => b[0].localeCompare(a[0]));
}

function showToast(message, type = 'success') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// ===== App Controller =====
class App {
    constructor() {
        this.store = new DataStore();
        this.currentUser = null;
        this.selectedValue = null;
        this.fireworks = new Fireworks(document.getElementById('fireworks-canvas'));
        this.draftTimer = null;
        this.init();
    }

    async init() {
        this.bindEvents();
        const session = sessionStorage.getItem('jwo_session');
        if (session) {
            this.currentUser = session;
            await this.store.load();
            this.showApp();
        }
    }

    bindEvents() {
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });
        document.getElementById('logout-btn').addEventListener('click', () => this.handleLogout());
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
        });
        document.getElementById('nomination-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleNomination();
        });
        ['nominee-name', 'nomination-reason', 'nomination-impact'].forEach(id => {
            document.getElementById(id).addEventListener('input', () => this.autoSaveDraft());
        });
        document.getElementById('restore-draft-btn').addEventListener('click', () => this.restoreDraft());
        document.getElementById('discard-draft-btn').addEventListener('click', () => this.discardDraft());
        document.getElementById('generate-newsletter').addEventListener('click', () => this.generateNewsletter());
        document.getElementById('copy-newsletter').addEventListener('click', () => this.copyNewsletter());
        document.getElementById('save-newsletter').addEventListener('click', () => this.saveNewsletter());
        document.getElementById('send-newsletter').addEventListener('click', () => this.sendNewsletter());
        document.getElementById('generate-quarterly').addEventListener('click', () => this.generateQuarterly());
        document.getElementById('copy-quarterly').addEventListener('click', () => this.copyQuarterly());

        document.querySelectorAll('.archive-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => this.switchArchiveTab(btn.dataset.archive));
        });
        document.getElementById('add-value-btn').addEventListener('click', () => this.addValue());
        document.getElementById('copy-link-btn').addEventListener('click', () => this.copyShareLink());
        document.getElementById('export-data-btn').addEventListener('click', () => this.exportData());
        document.getElementById('import-data-input').addEventListener('change', (e) => this.importData(e));
    }

    async handleLogin() {
        const name = document.getElementById('login-name').value.trim();
        if (!name) return;
        this.currentUser = name;
        sessionStorage.setItem('jwo_session', name);
        await this.store.load();
        this.showApp();
    }

    handleLogout() {
        sessionStorage.removeItem('jwo_session');
        this.currentUser = null;
        document.getElementById('app').classList.add('hidden');
        document.getElementById('login-screen').classList.remove('hidden');
        document.getElementById('login-name').value = '';
    }

    showApp() {
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');
        document.getElementById('current-user').textContent = this.currentUser;
        document.getElementById('nominator-name').value = this.currentUser;
        this.renderValues();
        this.renderCurrentWeek();
        this.renderNewsletterWeeks();
        this.renderQuarterlyOptions();
        this.renderArchive();
        this.renderSettings();
        this.checkReminder();
        this.checkDraft();
    }

    switchTab(tabId) {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
        document.getElementById(`tab-${tabId}`).classList.add('active');
        // Refresh data from cloud when switching tabs
        this.store.load().then(() => {
            if (tabId === 'current-week') this.renderCurrentWeek();
            if (tabId === 'newsletter') this.renderNewsletterWeeks();
            if (tabId === 'quarterly') this.renderQuarterlyOptions();
            if (tabId === 'archive') this.renderArchive();
            if (tabId === 'settings') this.renderSettings();
        });
    }

    // ===== Nomination =====
    renderValues() {
        const grid = document.getElementById('values-grid');
        const values = this.store.getValues();
        grid.innerHTML = values.map(v => `
            <label class="value-option" data-value-id="${v.id}">
                <input type="radio" name="value" value="${v.id}">
                <span class="value-emoji">${v.emoji}</span>
                <span class="value-text">${v.name}</span>
            </label>
        `).join('');
        grid.querySelectorAll('.value-option').forEach(opt => {
            opt.addEventListener('click', () => {
                grid.querySelectorAll('.value-option').forEach(o => o.classList.remove('selected'));
                opt.classList.add('selected');
                this.selectedValue = opt.dataset.valueId;
                this.autoSaveDraft();
            });
        });
    }

    async handleNomination() {
        const nominee = document.getElementById('nominee-name').value.trim();
        const nominator = document.getElementById('nominator-name').value.trim();
        const reason = document.getElementById('nomination-reason').value.trim();
        const impact = document.getElementById('nomination-impact').value.trim();

        if (!this.selectedValue) {
            showToast('Please select a behavior', 'error');
            return;
        }

        const values = this.store.getValues();
        const value = values.find(v => v.id === this.selectedValue);

        await this.store.addNomination({
            nominee, nominator,
            value: value.name, valueEmoji: value.emoji, valueId: value.id,
            reason, impact
        });

        this.fireworks.launch();
        this.clearDraft();

        document.getElementById('nomination-form').classList.add('hidden');
        document.getElementById('nomination-success').classList.remove('hidden');

        setTimeout(() => {
            document.getElementById('nomination-form').classList.remove('hidden');
            document.getElementById('nomination-success').classList.add('hidden');
            document.getElementById('nominee-name').value = '';
            document.getElementById('nomination-reason').value = '';
            document.getElementById('nomination-impact').value = '';
            document.querySelectorAll('.value-option').forEach(o => o.classList.remove('selected'));
            this.selectedValue = null;
        }, 3500);
    }

    // ===== Current Week =====
    renderCurrentWeek() {
        const week = getWeekRange();
        document.getElementById('current-week-range').textContent = week.label;
        const nominations = this.store.getNominations();
        const weekNoms = getNominationsForWeek(nominations, week.start);
        const container = document.getElementById('current-nominations');
        const emptyState = document.getElementById('no-nominations');

        if (weekNoms.length === 0) {
            container.classList.add('hidden');
            emptyState.classList.remove('hidden');
            return;
        }
        emptyState.classList.add('hidden');
        container.classList.remove('hidden');
        container.innerHTML = weekNoms.map(n => this.renderNominationCard(n, true)).join('');
        container.querySelectorAll('.delete-nomination-btn').forEach(btn => {
            btn.addEventListener('click', () => this.deleteNomination(btn.dataset.deleteId));
        });
    }

    async deleteNomination(id) {
        if (!confirm('Are you sure you want to delete this nomination?')) return;
        await this.store.deleteNomination(id);
        this.renderCurrentWeek();
        showToast('Nomination deleted');
    }

    renderNominationCard(n, showDelete = false) {
        return `
            <div class="nomination-card" data-nomination-id="${n.id}">
                <div class="nomination-card-header">
                    <h3>${n.nominee}</h3>
                    <span class="nomination-value-badge">${n.valueEmoji} ${n.value}</span>
                </div>
                <p>${n.reason}</p>
                ${n.impact ? `<p><strong>Impact:</strong> ${n.impact}</p>` : ''}
                <div class="meta">
                    Nominated by ${n.nominator} &bull; ${formatDate(n.timestamp)}
                    ${showDelete ? `<button class="btn btn-danger btn-small delete-nomination-btn" data-delete-id="${n.id}">🗑️ Delete</button>` : ''}
                </div>
            </div>
        `;
    }

    // ===== Newsletter =====
    renderNewsletterWeeks() {
        const select = document.getElementById('newsletter-week');
        const nominations = this.store.getNominations();
        const weeks = getAvailableWeeks(nominations);
        select.innerHTML = weeks.map(([key, label]) => `<option value="${key}">${label}</option>`).join('');
    }

    generateNewsletter() {
        const weekKey = document.getElementById('newsletter-week').value;
        if (!weekKey) { showToast('Please select a week', 'error'); return; }
        const nominations = this.store.getNominations();
        const weekNoms = getNominationsForWeek(nominations, weekKey);
        const weekRange = getWeekRange(new Date(weekKey));
        if (weekNoms.length === 0) {
            document.getElementById('newsletter-preview').innerHTML = '<p class="empty-state">No nominations found for this week.</p>';
            return;
        }
        const newsletter = this.buildNewsletterContent(weekNoms, weekRange);
        document.getElementById('newsletter-preview').textContent = newsletter;
    }

    buildNewsletterContent(nominations, weekRange) {
        let content = '';
        content += '══════════════════════════════════════════════════════\n';
        content += '   🏆 JWO TEAM RECOGNITION - WEEKLY SPOTLIGHT 🏆\n';
        content += '══════════════════════════════════════════════════════\n\n';
        content += `Week of ${weekRange.label}\n\n`;
        content += `Hello JWO Team! 👋\n\n`;
        content += `Here are this week's nominations celebrating team members\nwho are demonstrating key behaviors and driving our success forward:\n\n`;
        content += '──────────────────────────────────────────────────────\n\n';
        nominations.forEach((n, i) => {
            content += `${n.valueEmoji}  ${n.value.toUpperCase()}\n`;
            content += `    ⭐ ${n.nominee}\n`;
            content += `    Nominated by: ${n.nominator}\n\n`;
            content += `    "${n.reason}"\n`;
            if (n.impact) content += `\n    Impact: ${n.impact}\n`;
            if (i < nominations.length - 1) content += '\n──────────────────────────────────────────────────────\n\n';
        });
        content += '\n\n══════════════════════════════════════════════════════\n\n';
        content += `Congrats to the nominees! 🎉\n\n`;
        content += 'Keep pushing limits, asking why, and searching for possibilities.\nDon\'t hesitate to reach out if you need support!\n\n';
        content += '— JWO Leadership Team 🚀\n';
        return content;
    }

    copyNewsletter() {
        const preview = document.getElementById('newsletter-preview');
        const text = preview.textContent;
        if (!text || text.includes('Select a week') || text.includes('No nominations')) {
            showToast('Generate a newsletter first', 'error'); return;
        }
        navigator.clipboard.writeText(text).then(() => {
            showToast('📋 Copied! Paste into Outlook.');
        }).catch(() => {
            const ta = document.createElement('textarea'); ta.value = text;
            document.body.appendChild(ta); ta.select(); document.execCommand('copy');
            document.body.removeChild(ta);
            showToast('📋 Copied! Paste into Outlook.');
        });
    }

    async saveNewsletter() {
        const preview = document.getElementById('newsletter-preview');
        const text = preview.textContent;
        const weekKey = document.getElementById('newsletter-week').value;
        if (!text || text.includes('Select a week') || text.includes('No nominations')) {
            showToast('Generate a newsletter first', 'error'); return;
        }
        const weekRange = getWeekRange(new Date(weekKey));
        await this.store.addNewsletter({ weekKey, weekLabel: weekRange.label, content: text });
        showToast('💾 Newsletter saved to archive!');
    }

    sendNewsletter() {
        const preview = document.getElementById('newsletter-preview');
        const text = preview.textContent;
        if (!text || text.includes('Select a week') || text.includes('No nominations')) {
            showToast('Generate a newsletter first', 'error'); return;
        }
        const weekKey = document.getElementById('newsletter-week').value;
        const weekRange = getWeekRange(new Date(weekKey));
        const subject = encodeURIComponent(`🏆 JWO Team Recognition - Week of ${weekRange.label}`);
        const body = encodeURIComponent(text);
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
        showToast('✉️ Opening Outlook...');
    }

    // ===== Auto-Save Drafts =====
    autoSaveDraft() {
        clearTimeout(this.draftTimer);
        this.draftTimer = setTimeout(() => {
            const draft = {
                nominee: document.getElementById('nominee-name').value,
                reason: document.getElementById('nomination-reason').value,
                impact: document.getElementById('nomination-impact').value,
                valueId: this.selectedValue,
                savedAt: new Date().toISOString()
            };
            if (draft.nominee || draft.reason) {
                localStorage.setItem('jwo_draft', JSON.stringify(draft));
            }
        }, 1000);
    }

    checkDraft() {
        const draft = localStorage.getItem('jwo_draft');
        if (draft) {
            const data = JSON.parse(draft);
            if (data.nominee || data.reason) {
                document.getElementById('draft-banner').classList.remove('hidden');
            }
        }
    }

    restoreDraft() {
        const draft = JSON.parse(localStorage.getItem('jwo_draft') || '{}');
        if (draft.nominee) document.getElementById('nominee-name').value = draft.nominee;
        if (draft.reason) document.getElementById('nomination-reason').value = draft.reason;
        if (draft.impact) document.getElementById('nomination-impact').value = draft.impact;
        if (draft.valueId) {
            this.selectedValue = draft.valueId;
            const opt = document.querySelector(`[data-value-id="${draft.valueId}"]`);
            if (opt) opt.classList.add('selected');
        }
        document.getElementById('draft-banner').classList.add('hidden');
        showToast('📝 Draft restored!');
    }

    discardDraft() {
        localStorage.removeItem('jwo_draft');
        document.getElementById('draft-banner').classList.add('hidden');
        showToast('Draft discarded');
    }

    clearDraft() {
        localStorage.removeItem('jwo_draft');
        document.getElementById('draft-banner').classList.add('hidden');
    }

    // ===== Weekly Reminder =====
    checkReminder() {
        const today = new Date();
        const dayOfWeek = today.getDay();
        if (dayOfWeek >= 4 || dayOfWeek === 0) {
            const nominations = this.store.getNominations();
            const week = getWeekRange();
            const weekNoms = getNominationsForWeek(nominations, week.start);
            const userNominated = weekNoms.some(n => n.nominator === this.currentUser);
            if (!userNominated) {
                document.getElementById('reminder-banner').classList.remove('hidden');
            }
        }
    }

    // ===== Quarterly Summary =====
    renderQuarterlyOptions() {
        const select = document.getElementById('quarterly-select');
        const quarters = this.getAvailableQuarters();
        select.innerHTML = quarters.map(q => `<option value="${q.key}">${q.label}</option>`).join('');
    }

    getAvailableQuarters() {
        const quarters = [];
        const now = new Date();
        for (let i = 0; i < 4; i++) {
            const date = new Date(now.getFullYear(), now.getMonth() - (i * 3), 1);
            const q = Math.floor(date.getMonth() / 3) + 1;
            const year = date.getFullYear();
            const startMonth = (q - 1) * 3;
            const start = new Date(year, startMonth, 1);
            const end = new Date(year, startMonth + 3, 0);
            quarters.push({
                key: `${year}-Q${q}`,
                label: `Q${q} ${year} (${start.toLocaleDateString('en-US', { month: 'short' })} - ${end.toLocaleDateString('en-US', { month: 'short' })})`,
                start, end
            });
        }
        return quarters;
    }

    generateQuarterly() {
        const quarterKey = document.getElementById('quarterly-select').value;
        if (!quarterKey) return;
        const quarters = this.getAvailableQuarters();
        const quarter = quarters.find(q => q.key === quarterKey);
        if (!quarter) return;

        const nominations = this.store.getNominations().filter(n => {
            const d = new Date(n.timestamp);
            return d >= quarter.start && d <= quarter.end;
        });

        if (nominations.length === 0) {
            document.getElementById('quarterly-stats').classList.add('hidden');
            document.getElementById('quarterly-preview').classList.add('hidden');
            showToast('No nominations found for this quarter', 'error');
            return;
        }

        const uniqueNominees = [...new Set(nominations.map(n => n.nominee))];
        const uniqueNominators = [...new Set(nominations.map(n => n.nominator))];
        const behaviorCounts = {};
        nominations.forEach(n => { behaviorCounts[n.value] = (behaviorCounts[n.value] || 0) + 1; });
        const topBehavior = Object.entries(behaviorCounts).sort((a, b) => b[1] - a[1])[0];
        const nomineeCounts = {};
        nominations.forEach(n => { nomineeCounts[n.nominee] = (nomineeCounts[n.nominee] || 0) + 1; });
        const sortedNominees = Object.entries(nomineeCounts).sort((a, b) => b[1] - a[1]);

        document.getElementById('stat-total').textContent = nominations.length;
        document.getElementById('stat-nominees').textContent = uniqueNominees.length;
        document.getElementById('stat-nominators').textContent = uniqueNominators.length;
        document.getElementById('stat-top-behavior').textContent = topBehavior ? topBehavior[0].split(' ').slice(0, 2).join(' ') : '-';

        document.getElementById('quarterly-top-nominees').innerHTML = sortedNominees.slice(0, 10).map(([name, count]) => `
            <div class="quarterly-nominee-item">
                <span>⭐ ${name}</span>
                <span class="quarterly-nominee-count">${count} nomination${count > 1 ? 's' : ''}</span>
            </div>
        `).join('');

        const maxCount = Math.max(...Object.values(behaviorCounts));
        document.getElementById('quarterly-behavior-breakdown').innerHTML = Object.entries(behaviorCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([behavior, count]) => `
                <div class="quarterly-bar">
                    <span class="quarterly-bar-label">${behavior}</span>
                    <div class="quarterly-bar-track">
                        <div class="quarterly-bar-fill" style="width: ${(count / maxCount) * 100}%"></div>
                    </div>
                    <span class="quarterly-bar-count">${count}</span>
                </div>
            `).join('');

        const weeklyData = new Map();
        nominations.forEach(n => {
            const week = getWeekRange(new Date(n.timestamp));
            weeklyData.set(week.label, (weeklyData.get(week.label) || 0) + 1);
        });
        const maxWeekly = Math.max(...weeklyData.values());
        document.getElementById('quarterly-weekly-breakdown').innerHTML = Array.from(weeklyData.entries()).map(([week, count]) => `
            <div class="quarterly-bar">
                <span class="quarterly-bar-label">${week}</span>
                <div class="quarterly-bar-track">
                    <div class="quarterly-bar-fill" style="width: ${(count / maxWeekly) * 100}%"></div>
                </div>
                <span class="quarterly-bar-count">${count}</span>
            </div>
        `).join('');

        document.getElementById('quarterly-stats').classList.remove('hidden');

        // Build text version
        let text = `📊 JWO QUARTERLY RECOGNITION SUMMARY\n${quarter.label}\n`;
        text += '══════════════════════════════════════════════════════\n\n';
        text += `Total Nominations: ${nominations.length}\nUnique Nominees: ${uniqueNominees.length}\nNominators: ${uniqueNominators.length}\n\n`;
        text += `🏅 MOST RECOGNIZED:\n`;
        sortedNominees.slice(0, 5).forEach(([name, count], i) => { text += `   ${i + 1}. ${name} (${count})\n`; });
        text += `\n📈 BEHAVIOR BREAKDOWN:\n`;
        Object.entries(behaviorCounts).sort((a, b) => b[1] - a[1]).forEach(([b, c]) => { text += `   • ${b}: ${c}\n`; });
        text += '\n— JWO Leadership Team 🚀\n';
        document.getElementById('quarterly-preview').textContent = text;
        document.getElementById('quarterly-preview').classList.remove('hidden');
    }

    copyQuarterly() {
        const text = document.getElementById('quarterly-preview').textContent;
        if (!text) { showToast('Generate a summary first', 'error'); return; }
        navigator.clipboard.writeText(text).then(() => showToast('📋 Quarterly summary copied!'))
            .catch(() => showToast('Could not copy', 'error'));
    }

    // ===== Archive =====
    switchArchiveTab(tab) {
        document.querySelectorAll('.archive-tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.archive-content').forEach(c => c.classList.remove('active'));
        document.querySelector(`[data-archive="${tab}"]`).classList.add('active');
        document.getElementById(`archive-${tab}`).classList.add('active');
    }

    renderArchive() {
        this.renderArchiveNominations();
        this.renderArchiveNewsletters();
    }

    renderArchiveNominations() {
        const container = document.getElementById('archive-nominations');
        const nominations = this.store.getNominations().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        if (nominations.length === 0) {
            container.innerHTML = '<div class="empty-state"><div class="empty-icon">🌟</div><p>No nominations yet.</p></div>';
            return;
        }
        container.innerHTML = nominations.map(n => this.renderNominationCard(n)).join('');
    }

    renderArchiveNewsletters() {
        const container = document.getElementById('archive-newsletters');
        const newsletters = this.store.getNewsletters().sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
        if (newsletters.length === 0) {
            container.innerHTML = '<div class="empty-state"><div class="empty-icon">📰</div><p>No saved newsletters yet.</p></div>';
            return;
        }
        container.innerHTML = newsletters.map(nl => `
            <div class="newsletter-archive-card" data-nl-id="${nl.id}">
                <h4>📰 Week of ${nl.weekLabel}</h4>
                <p>Saved on ${formatDate(nl.savedAt)}</p>
                <div class="newsletter-expanded hidden">${nl.content}</div>
            </div>
        `).join('');
        container.querySelectorAll('.newsletter-archive-card').forEach(card => {
            card.addEventListener('click', () => {
                card.querySelector('.newsletter-expanded').classList.toggle('hidden');
            });
        });
    }

    // ===== Settings =====
    renderSettings() {
        this.renderValuesList();
        document.getElementById('share-link').value = window.location.href;
    }

    renderValuesList() {
        const container = document.getElementById('values-list');
        const values = this.store.getValues();
        container.innerHTML = values.map(v => `
            <div class="value-setting-item">
                <span>${v.emoji} ${v.name}</span>
                <button class="btn btn-danger btn-small" data-remove-value="${v.id}">Remove</button>
            </div>
        `).join('');
        container.querySelectorAll('[data-remove-value]').forEach(btn => {
            btn.addEventListener('click', () => this.removeValue(btn.dataset.removeValue));
        });
    }

    addValue() {
        const nameInput = document.getElementById('new-value-name');
        const emojiInput = document.getElementById('new-value-emoji');
        const name = nameInput.value.trim();
        const emoji = emojiInput.value.trim() || '⭐';
        if (!name) { showToast('Please enter a behavior name', 'error'); return; }
        const values = this.store.getValues();
        values.push({ id: name.toLowerCase().replace(/\s+/g, '-'), name, emoji });
        this.store.setValues(values);
        nameInput.value = ''; emojiInput.value = '';
        this.renderValuesList();
        this.renderValues();
        showToast('✨ Behavior added!');
    }

    removeValue(id) {
        const values = this.store.getValues().filter(v => v.id !== id);
        this.store.setValues(values);
        this.renderValuesList();
        this.renderValues();
        showToast('Behavior removed');
    }

    copyShareLink() {
        const link = document.getElementById('share-link').value;
        navigator.clipboard.writeText(link).then(() => showToast('🔗 Link copied! Share with your team.'))
            .catch(() => showToast('Could not copy link', 'error'));
    }

    exportData() {
        const data = this.store.exportAll();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url;
        a.download = `jwo-recognition-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click(); URL.revokeObjectURL(url);
        showToast('📦 Data exported!');
    }

    async importData(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = JSON.parse(e.target.result);
                await this.store.importAll(data);
                this.showApp();
                showToast('✅ Data imported successfully!');
            } catch (err) { showToast('Invalid file format', 'error'); }
        };
        reader.readAsText(file);
        event.target.value = '';
    }
}

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', () => { new App(); });
