// ===== JWO Team Recognition App =====
// Supabase Backend

const SUPABASE_URL = 'https://gmpqnvfcjbskqsfbwaa.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtcW9udmZsY2pic2txc2Zid2FzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMjQzODIsImV4cCI6MjA5NDgwMDM4Mn0.bhEaxiqpIf9hqTR7C0OglVSoPrN6WLg5RLZA7DFO6IA';

// Default team behaviors
const DEFAULT_VALUES = [
    { id: 'ruthlessly-simplify', name: 'Ruthlessly Simplify to Meet Customer Needs', emoji: '🎯' },
    { id: 'collaborate-root-causes', name: 'Collaborate Across Teams to Solve Root Causes Fast', emoji: '🤝' },
    { id: 'persist-through-no', name: 'Persist Through "No" and Build the Case for "Yes"', emoji: '💪' }
];

// ===== Supabase Helper =====
class SupabaseClient {
    constructor(url, key) {
        this.url = url;
        this.headers = {
            'apikey': key,
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        };
    }

    async select(table) {
        const res = await fetch(`${this.url}/rest/v1/${table}?order=created_at.desc`, {
            headers: this.headers
        });
        if (!res.ok) throw new Error(`Failed to fetch ${table}`);
        return await res.json();
    }

    async insert(table, data) {
        const res = await fetch(`${this.url}/rest/v1/${table}`, {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error(`Failed to insert into ${table}`);
        return await res.json();
    }

    async delete(table, id) {
        const res = await fetch(`${this.url}/rest/v1/${table}?id=eq.${id}`, {
            method: 'DELETE',
            headers: this.headers
        });
        if (!res.ok) throw new Error(`Failed to delete from ${table}`);
    }
}

// ===== Data Store =====
class DataStore {
    constructor() {
        this.db = new SupabaseClient(SUPABASE_URL, SUPABASE_KEY);
    }

    getValues() {
        return DEFAULT_VALUES;
    }

    async getNominations() {
        try {
            return await this.db.select('nominations');
        } catch (err) {
            console.error('Error loading nominations:', err);
            return [];
        }
    }

    async addNomination(nomination) {
        try {
            const result = await this.db.insert('nominations', nomination);
            return result[0];
        } catch (err) {
            console.error('Error saving nomination:', err);
            showToast('Error saving — please try again', 'error');
            return null;
        }
    }

    async deleteNomination(id) {
        try {
            await this.db.delete('nominations', id);
        } catch (err) {
            console.error('Error deleting nomination:', err);
            showToast('Error deleting — please try again', 'error');
        }
    }

    async getNewsletters() {
        try {
            return await this.db.select('newsletters');
        } catch (err) {
            console.error('Error loading newsletters:', err);
            return [];
        }
    }

    async addNewsletter(newsletter) {
        try {
            const result = await this.db.insert('newsletters', newsletter);
            return result[0];
        } catch (err) {
            console.error('Error saving newsletter:', err);
            showToast('Error saving — please try again', 'error');
            return null;
        }
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
    resize() { this.canvas.width = window.innerWidth; this.canvas.height = window.innerHeight; }
    launch() {
        this.animating = true;
        for (let i = 0; i < 8; i++) {
            setTimeout(() => this.createBurst(Math.random() * this.canvas.width, Math.random() * this.canvas.height * 0.6 + 50), i * 200);
        }
        this.animate();
        setTimeout(() => { this.animating = false; }, 3000);
    }
    createBurst(x, y) {
        const colors = ['#FF9900', '#FFB84D', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96E6A1', '#DDA0DD', '#F7DC6F'];
        for (let i = 0; i < 40; i++) {
            const angle = (Math.PI * 2 * i) / 40;
            this.particles.push({
                x, y, vx: Math.cos(angle) * (2 + Math.random() * 4), vy: Math.sin(angle) * (2 + Math.random() * 4),
                size: 2 + Math.random() * 3, color: colors[Math.floor(Math.random() * colors.length)],
                alpha: 1, decay: 0.015 + Math.random() * 0.01, gravity: 0.05,
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
            this.ctx.save(); this.ctx.globalAlpha = p.alpha; this.ctx.fillStyle = p.color;
            if (p.shape === 'star') { this.drawStar(p.x, p.y, p.size); }
            else { this.ctx.beginPath(); this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); this.ctx.fill(); }
            this.ctx.restore(); return true;
        });
        requestAnimationFrame(() => this.animate());
    }
    drawStar(x, y, size) {
        this.ctx.beginPath();
        for (let i = 0; i < 5; i++) { const a = (i * 4 * Math.PI) / 5 - Math.PI / 2; this.ctx[i === 0 ? 'moveTo' : 'lineTo'](x + Math.cos(a) * size, y + Math.sin(a) * size); }
        this.ctx.closePath(); this.ctx.fill();
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
    const start = new Date(weekStart); start.setHours(0, 0, 0, 0);
    const end = new Date(start); end.setDate(end.getDate() + 7);
    return nominations.filter(n => {
        const nDate = new Date(n.created_at);
        return nDate >= start && nDate < end;
    });
}

function getAvailableWeeks(nominations) {
    const weeks = new Map();
    nominations.forEach(n => {
        const date = new Date(n.created_at);
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
        this.nominations = [];
        this.newsletters = [];
        this.bindEvents();
        this.checkSession();
    }

    async checkSession() {
        const session = sessionStorage.getItem('jwo_session');
        if (session) {
            this.currentUser = session;
            await this.loadData();
            this.showApp();
        }
    }

    async loadData() {
        this.nominations = await this.store.getNominations();
        this.newsletters = await this.store.getNewsletters();
    }

    bindEvents() {
        document.getElementById('login-form').addEventListener('submit', (e) => { e.preventDefault(); this.handleLogin(); });
        document.getElementById('logout-btn').addEventListener('click', () => this.handleLogout());
        document.querySelectorAll('.nav-btn').forEach(btn => { btn.addEventListener('click', () => this.switchTab(btn.dataset.tab)); });
        document.getElementById('nomination-form').addEventListener('submit', (e) => { e.preventDefault(); this.handleNomination(); });
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
        document.querySelectorAll('.archive-tab-btn').forEach(btn => { btn.addEventListener('click', () => this.switchArchiveTab(btn.dataset.archive)); });
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
        await this.loadData();
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

    async switchTab(tabId) {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
        document.getElementById(`tab-${tabId}`).classList.add('active');
        // Refresh from database when switching tabs
        await this.loadData();
        if (tabId === 'current-week') this.renderCurrentWeek();
        if (tabId === 'newsletter') this.renderNewsletterWeeks();
        if (tabId === 'quarterly') this.renderQuarterlyOptions();
        if (tabId === 'archive') this.renderArchive();
        if (tabId === 'settings') this.renderSettings();
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

        if (!this.selectedValue) { showToast('Please select a behavior', 'error'); return; }

        const values = this.store.getValues();
        const value = values.find(v => v.id === this.selectedValue);

        await this.store.addNomination({
            nominee, nominator,
            value: value.name, value_emoji: value.emoji, value_id: value.id,
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
        const weekNoms = getNominationsForWeek(this.nominations, week.start);
        const container = document.getElementById('current-nominations');
        const emptyState = document.getElementById('no-nominations');

        if (weekNoms.length === 0) { container.classList.add('hidden'); emptyState.classList.remove('hidden'); return; }
        emptyState.classList.add('hidden'); container.classList.remove('hidden');
        container.innerHTML = weekNoms.map(n => this.renderNominationCard(n, true)).join('');
        container.querySelectorAll('.delete-nomination-btn').forEach(btn => {
            btn.addEventListener('click', () => this.deleteNomination(btn.dataset.deleteId));
        });
    }

    async deleteNomination(id) {
        if (!confirm('Are you sure you want to delete this nomination?')) return;
        await this.store.deleteNomination(id);
        await this.loadData();
        this.renderCurrentWeek();
        showToast('Nomination deleted');
    }

    renderNominationCard(n, showDelete = false) {
        return `
            <div class="nomination-card">
                <div class="nomination-card-header">
                    <h3>${n.nominee}</h3>
                    <span class="nomination-value-badge">${n.value_emoji || n.valueEmoji || ''} ${n.value}</span>
                </div>
                <p>${n.reason}</p>
                ${n.impact ? `<p><strong>Impact:</strong> ${n.impact}</p>` : ''}
                <div class="meta">
                    Nominated by ${n.nominator} &bull; ${formatDate(n.created_at)}
                    ${showDelete ? `<button class="btn btn-danger btn-small delete-nomination-btn" data-delete-id="${n.id}">🗑️ Delete</button>` : ''}
                </div>
            </div>
        `;
    }

    // ===== Newsletter =====
    renderNewsletterWeeks() {
        const select = document.getElementById('newsletter-week');
        const weeks = getAvailableWeeks(this.nominations);
        select.innerHTML = weeks.map(([key, label]) => `<option value="${key}">${label}</option>`).join('');
    }

    generateNewsletter() {
        const weekKey = document.getElementById('newsletter-week').value;
        if (!weekKey) { showToast('Please select a week', 'error'); return; }
        const weekNoms = getNominationsForWeek(this.nominations, weekKey);
        const weekRange = getWeekRange(new Date(weekKey));
        if (weekNoms.length === 0) {
            document.getElementById('newsletter-preview').innerHTML = '<p class="empty-state">No nominations found for this week.</p>';
            return;
        }
        document.getElementById('newsletter-preview').textContent = this.buildNewsletterContent(weekNoms, weekRange);
    }

    buildNewsletterContent(nominations, weekRange) {
        let c = '';
        c += '══════════════════════════════════════════════════════\n';
        c += '   🏆 JWO TEAM RECOGNITION - WEEKLY SPOTLIGHT 🏆\n';
        c += '══════════════════════════════════════════════════════\n\n';
        c += `Week of ${weekRange.label}\n\n`;
        c += `Hello JWO Team! 👋\n\n`;
        c += `Here are this week's nominations celebrating team members\nwho are demonstrating key behaviors and driving our success forward:\n\n`;
        c += '──────────────────────────────────────────────────────\n\n';
        nominations.forEach((n, i) => {
            c += `${n.value_emoji || n.valueEmoji || ''}  ${n.value.toUpperCase()}\n`;
            c += `    ⭐ ${n.nominee}\n    Nominated by: ${n.nominator}\n\n`;
            c += `    "${n.reason}"\n`;
            if (n.impact) c += `\n    Impact: ${n.impact}\n`;
            if (i < nominations.length - 1) c += '\n──────────────────────────────────────────────────────\n\n';
        });
        c += '\n\n══════════════════════════════════════════════════════\n\n';
        c += `Congrats to the nominees! 🎉\n\n`;
        c += 'Keep pushing limits, asking why, and searching for possibilities.\nDon\'t hesitate to reach out if you need support!\n\n';
        c += '— JWO Leadership Team 🚀\n';
        return c;
    }

    copyNewsletter() {
        const text = document.getElementById('newsletter-preview').textContent;
        if (!text || text.includes('Select a week') || text.includes('No nominations')) { showToast('Generate a newsletter first', 'error'); return; }
        navigator.clipboard.writeText(text).then(() => showToast('📋 Copied! Paste into Outlook.'));
    }

    async saveNewsletter() {
        const text = document.getElementById('newsletter-preview').textContent;
        const weekKey = document.getElementById('newsletter-week').value;
        if (!text || text.includes('Select a week') || text.includes('No nominations')) { showToast('Generate a newsletter first', 'error'); return; }
        const weekRange = getWeekRange(new Date(weekKey));
        await this.store.addNewsletter({ week_key: weekKey, week_label: weekRange.label, content: text });
        showToast('💾 Newsletter saved to archive!');
    }

    sendNewsletter() {
        const text = document.getElementById('newsletter-preview').textContent;
        if (!text || text.includes('Select a week') || text.includes('No nominations')) { showToast('Generate a newsletter first', 'error'); return; }
        const weekKey = document.getElementById('newsletter-week').value;
        const weekRange = getWeekRange(new Date(weekKey));
        const subject = encodeURIComponent(`🏆 JWO Team Recognition - Week of ${weekRange.label}`);
        window.location.href = `mailto:?subject=${subject}&body=${encodeURIComponent(text)}`;
        showToast('✉️ Opening Outlook...');
    }

    // ===== Drafts =====
    autoSaveDraft() {
        clearTimeout(this.draftTimer);
        this.draftTimer = setTimeout(() => {
            const draft = {
                nominee: document.getElementById('nominee-name').value,
                reason: document.getElementById('nomination-reason').value,
                impact: document.getElementById('nomination-impact').value,
                valueId: this.selectedValue
            };
            if (draft.nominee || draft.reason) localStorage.setItem('jwo_draft', JSON.stringify(draft));
        }, 1000);
    }
    checkDraft() {
        const draft = localStorage.getItem('jwo_draft');
        if (draft) { const d = JSON.parse(draft); if (d.nominee || d.reason) document.getElementById('draft-banner').classList.remove('hidden'); }
    }
    restoreDraft() {
        const draft = JSON.parse(localStorage.getItem('jwo_draft') || '{}');
        if (draft.nominee) document.getElementById('nominee-name').value = draft.nominee;
        if (draft.reason) document.getElementById('nomination-reason').value = draft.reason;
        if (draft.impact) document.getElementById('nomination-impact').value = draft.impact;
        if (draft.valueId) { this.selectedValue = draft.valueId; const opt = document.querySelector(`[data-value-id="${draft.valueId}"]`); if (opt) opt.classList.add('selected'); }
        document.getElementById('draft-banner').classList.add('hidden');
        showToast('📝 Draft restored!');
    }
    discardDraft() { localStorage.removeItem('jwo_draft'); document.getElementById('draft-banner').classList.add('hidden'); showToast('Draft discarded'); }
    clearDraft() { localStorage.removeItem('jwo_draft'); document.getElementById('draft-banner').classList.add('hidden'); }

    // ===== Reminder =====
    checkReminder() {
        const day = new Date().getDay();
        if (day >= 4 || day === 0) {
            const week = getWeekRange();
            const weekNoms = getNominationsForWeek(this.nominations, week.start);
            if (!weekNoms.some(n => n.nominator === this.currentUser)) {
                document.getElementById('reminder-banner').classList.remove('hidden');
            }
        }
    }

    // ===== Quarterly =====
    renderQuarterlyOptions() {
        const select = document.getElementById('quarterly-select');
        select.innerHTML = this.getAvailableQuarters().map(q => `<option value="${q.key}">${q.label}</option>`).join('');
    }
    getAvailableQuarters() {
        const quarters = []; const now = new Date();
        for (let i = 0; i < 4; i++) {
            const date = new Date(now.getFullYear(), now.getMonth() - (i * 3), 1);
            const q = Math.floor(date.getMonth() / 3) + 1, year = date.getFullYear();
            const start = new Date(year, (q - 1) * 3, 1), end = new Date(year, (q - 1) * 3 + 3, 0);
            quarters.push({ key: `${year}-Q${q}`, label: `Q${q} ${year} (${start.toLocaleDateString('en-US', { month: 'short' })} - ${end.toLocaleDateString('en-US', { month: 'short' })})`, start, end });
        }
        return quarters;
    }
    generateQuarterly() {
        const quarterKey = document.getElementById('quarterly-select').value;
        const quarter = this.getAvailableQuarters().find(q => q.key === quarterKey);
        if (!quarter) return;
        const noms = this.nominations.filter(n => { const d = new Date(n.created_at); return d >= quarter.start && d <= quarter.end; });
        if (noms.length === 0) { document.getElementById('quarterly-stats').classList.add('hidden'); document.getElementById('quarterly-preview').classList.add('hidden'); showToast('No nominations for this quarter', 'error'); return; }

        const uniqueNominees = [...new Set(noms.map(n => n.nominee))];
        const uniqueNominators = [...new Set(noms.map(n => n.nominator))];
        const behaviorCounts = {}; noms.forEach(n => { behaviorCounts[n.value] = (behaviorCounts[n.value] || 0) + 1; });
        const topBehavior = Object.entries(behaviorCounts).sort((a, b) => b[1] - a[1])[0];
        const nomineeCounts = {}; noms.forEach(n => { nomineeCounts[n.nominee] = (nomineeCounts[n.nominee] || 0) + 1; });
        const sortedNominees = Object.entries(nomineeCounts).sort((a, b) => b[1] - a[1]);

        document.getElementById('stat-total').textContent = noms.length;
        document.getElementById('stat-nominees').textContent = uniqueNominees.length;
        document.getElementById('stat-nominators').textContent = uniqueNominators.length;
        document.getElementById('stat-top-behavior').textContent = topBehavior ? topBehavior[0].split(' ').slice(0, 2).join(' ') : '-';

        document.getElementById('quarterly-top-nominees').innerHTML = sortedNominees.slice(0, 10).map(([name, count]) =>
            `<div class="quarterly-nominee-item"><span>⭐ ${name}</span><span class="quarterly-nominee-count">${count}</span></div>`).join('');

        const maxB = Math.max(...Object.values(behaviorCounts));
        document.getElementById('quarterly-behavior-breakdown').innerHTML = Object.entries(behaviorCounts).sort((a, b) => b[1] - a[1]).map(([b, c]) =>
            `<div class="quarterly-bar"><span class="quarterly-bar-label">${b}</span><div class="quarterly-bar-track"><div class="quarterly-bar-fill" style="width:${(c/maxB)*100}%"></div></div><span class="quarterly-bar-count">${c}</span></div>`).join('');

        const weeklyData = new Map(); noms.forEach(n => { const w = getWeekRange(new Date(n.created_at)).label; weeklyData.set(w, (weeklyData.get(w) || 0) + 1); });
        const maxW = Math.max(...weeklyData.values());
        document.getElementById('quarterly-weekly-breakdown').innerHTML = Array.from(weeklyData.entries()).map(([w, c]) =>
            `<div class="quarterly-bar"><span class="quarterly-bar-label">${w}</span><div class="quarterly-bar-track"><div class="quarterly-bar-fill" style="width:${(c/maxW)*100}%"></div></div><span class="quarterly-bar-count">${c}</span></div>`).join('');

        document.getElementById('quarterly-stats').classList.remove('hidden');
        let text = `📊 JWO QUARTERLY SUMMARY\n${quarter.label}\n══════════════════════════════\nTotal: ${noms.length} | Nominees: ${uniqueNominees.length} | Nominators: ${uniqueNominators.length}\n\n🏅 MOST RECOGNIZED:\n`;
        sortedNominees.slice(0, 5).forEach(([name, count], i) => { text += `  ${i+1}. ${name} (${count})\n`; });
        text += `\n📈 BEHAVIORS:\n`; Object.entries(behaviorCounts).sort((a,b) => b[1]-a[1]).forEach(([b,c]) => { text += `  • ${b}: ${c}\n`; });
        text += '\n— JWO Leadership Team 🚀\n';
        document.getElementById('quarterly-preview').textContent = text;
        document.getElementById('quarterly-preview').classList.remove('hidden');
    }
    copyQuarterly() {
        const text = document.getElementById('quarterly-preview').textContent;
        if (!text) { showToast('Generate a summary first', 'error'); return; }
        navigator.clipboard.writeText(text).then(() => showToast('📋 Copied!'));
    }

    // ===== Archive =====
    switchArchiveTab(tab) {
        document.querySelectorAll('.archive-tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.archive-content').forEach(c => c.classList.remove('active'));
        document.querySelector(`[data-archive="${tab}"]`).classList.add('active');
        document.getElementById(`archive-${tab}`).classList.add('active');
    }
    renderArchive() { this.renderArchiveNominations(); this.renderArchiveNewsletters(); }
    renderArchiveNominations() {
        const container = document.getElementById('archive-nominations');
        if (this.nominations.length === 0) { container.innerHTML = '<div class="empty-state"><div class="empty-icon">🌟</div><p>No nominations yet.</p></div>'; return; }
        container.innerHTML = this.nominations.map(n => this.renderNominationCard(n)).join('');
    }
    renderArchiveNewsletters() {
        const container = document.getElementById('archive-newsletters');
        if (this.newsletters.length === 0) { container.innerHTML = '<div class="empty-state"><div class="empty-icon">📰</div><p>No saved newsletters yet.</p></div>'; return; }
        container.innerHTML = this.newsletters.map(nl => `
            <div class="newsletter-archive-card"><h4>📰 Week of ${nl.week_label}</h4><p>Saved on ${formatDate(nl.created_at)}</p><div class="newsletter-expanded hidden">${nl.content}</div></div>
        `).join('');
        container.querySelectorAll('.newsletter-archive-card').forEach(card => { card.addEventListener('click', () => card.querySelector('.newsletter-expanded').classList.toggle('hidden')); });
    }

    // ===== Settings =====
    renderSettings() { this.renderValuesList(); document.getElementById('share-link').value = window.location.href; }
    renderValuesList() {
        const container = document.getElementById('values-list');
        container.innerHTML = this.store.getValues().map(v => `<div class="value-setting-item"><span>${v.emoji} ${v.name}</span></div>`).join('');
    }
    addValue() { showToast('Contact app admin to add behaviors', 'error'); }
    removeValue() { showToast('Contact app admin to remove behaviors', 'error'); }
    copyShareLink() { navigator.clipboard.writeText(document.getElementById('share-link').value).then(() => showToast('🔗 Link copied!')); }
    exportData() {
        const data = { nominations: this.nominations, newsletters: this.newsletters, values: this.store.getValues(), exportedAt: new Date().toISOString() };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
        a.download = `jwo-backup-${new Date().toISOString().split('T')[0]}.json`; a.click();
        showToast('📦 Data exported!');
    }
    importData() { showToast('Import not available with cloud database', 'error'); }
}

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', () => { new App(); });
