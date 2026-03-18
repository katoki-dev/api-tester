/* ═══════════════════════════════════════════
   Universal API Tester — Application Logic
   ═══════════════════════════════════════════ */

// ─── State ───
let history = JSON.parse(localStorage.getItem('api_tester_history') || '[]');
renderHistory();

// Color-code method selector on change
const methodSelect = document.getElementById('httpMethod');
methodSelect.addEventListener('change', syncMethodColor);
syncMethodColor();

function syncMethodColor() {
    methodSelect.className = 'method-select ' + methodSelect.value;
}

// ─── Presets ───
const PRESETS = {
    get: {
        method: 'GET',
        path: '/v1/resource',
        body: null
    },
    create: {
        method: 'POST',
        path: '/v1/resource',
        body: {
            name: 'New Resource',
            description: 'Created via Universal API Tester'
        }
    },
    update: {
        method: 'PUT',
        path: '/v1/resource/1',
        body: {
            name: 'Updated Resource',
            description: 'Modified values'
        }
    },
    delete: {
        method: 'DELETE',
        path: '/v1/resource/1',
        body: null
    },
    health: {
        method: 'GET',
        path: '/health',
        body: null
    }
};

function loadPreset(name) {
    const preset = PRESETS[name];
    if (!preset) return;

    document.getElementById('httpMethod').value = preset.method;
    syncMethodColor();
    document.getElementById('requestPath').value = preset.path;
    document.getElementById('requestBody').value = preset.body
        ? JSON.stringify(preset.body, null, 2)
        : '';

    // Activate body tab
    const bodyTab = document.querySelector('.pane-tab');
    if (bodyTab) switchTab(bodyTab, 'bodyTab');
}

// ─── Tab Switching ───
function switchTab(tabEl, contentId) {
    // Deactivate all tabs
    tabEl.parentElement.querySelectorAll('.pane-tab').forEach(t => t.classList.remove('active'));
    tabEl.classList.add('active');

    // Show target content, hide others
    const pane = tabEl.closest('.pane');
    pane.querySelectorAll('.pane-content').forEach(c => c.classList.add('hidden'));
    document.getElementById(contentId).classList.remove('hidden');
}

// ─── Send Request ───
async function sendRequest() {
    const baseUrl = document.getElementById('baseUrl').value.replace(/\/$/, '');
    const token = document.getElementById('jwtToken').value.trim();
    const method = document.getElementById('httpMethod').value;
    const path = document.getElementById('requestPath').value;
    const bodyStr = document.getElementById('requestBody').value.trim();

    const url = baseUrl + path;

    // Update auth header preview
    document.getElementById('authHeaderPreview').textContent =
        token ? `Bearer ${token.substring(0, 20)}...` : '(not set)';

    // Show loading
    const responseBody = document.getElementById('responseBody');
    responseBody.innerHTML = '<span class="loading">⏳ Sending request...</span>';
    document.getElementById('statusBadge').textContent = '...';
    document.getElementById('statusBadge').className = 'meta-badge';
    document.getElementById('responseTime').textContent = '';
    document.getElementById('responseSize').textContent = '';

    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const fetchOpts = { method, headers };

    if (method !== 'GET' && method !== 'DELETE' && bodyStr) {
        try {
            JSON.parse(bodyStr); // validate
            fetchOpts.body = bodyStr;
        } catch (e) {
            responseBody.innerHTML = syntaxHighlight({
                error: 'Invalid JSON in request body',
                details: e.message
            });
            document.getElementById('statusBadge').textContent = 'ERR';
            document.getElementById('statusBadge').className = 'meta-badge error';
            return;
        }
    }

    const startTime = performance.now();

    try {
        const response = await fetch(url, fetchOpts);
        const elapsed = Math.round(performance.now() - startTime);
        let data;
        const contentType = response.headers.get('content-type') || '';

        if (contentType.includes('application/json')) {
            data = await response.json();
        } else {
            data = await response.text();
        }

        // Update status
        const statusBadge = document.getElementById('statusBadge');
        statusBadge.textContent = response.status + ' ' + response.statusText;
        if (response.ok) {
            statusBadge.className = 'meta-badge success';
        } else if (response.status >= 400 && response.status < 500) {
            statusBadge.className = 'meta-badge warn';
        } else {
            statusBadge.className = 'meta-badge error';
        }

        document.getElementById('responseTime').textContent = elapsed + 'ms';

        const dataStr = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
        document.getElementById('responseSize').textContent = formatBytes(new Blob([dataStr]).size);

        if (typeof data === 'object') {
            responseBody.innerHTML = syntaxHighlight(data);
        } else {
            responseBody.textContent = data;
        }

        // Add to history
        addToHistory(method, path, response.status, elapsed);

    } catch (err) {
        const elapsed = Math.round(performance.now() - startTime);
        document.getElementById('statusBadge').textContent = 'ERR';
        document.getElementById('statusBadge').className = 'meta-badge error';
        document.getElementById('responseTime').textContent = elapsed + 'ms';

        responseBody.innerHTML = syntaxHighlight({
            success: false,
            error: {
                code: 'NETWORK_ERROR',
                message: 'Failed to connect to the server.',
                details: [
                    { reason: err.message },
                    { hint: 'Is the server running and accessible?' },
                    { troubleshooting: 'Check for CORS issues in the browser console if the server is remote.' }
                ]
            }
        });

        addToHistory(method, path, 0, elapsed);
    }
}

// ─── Test Connection ───
async function testConnection() {
    const baseUrl = document.getElementById('baseUrl').value.replace(/\/$/, '');
    try {
        const r = await fetch(baseUrl + '/health');
        const data = await r.json();
        alert(r.ok ? '✅ Connected!\n\n' + JSON.stringify(data, null, 2) : '⚠️ Server responded with status ' + r.status);
    } catch (e) {
        alert('❌ Connection failed\n\n' + e.message);
    }
}

// ─── History ───
function addToHistory(method, path, status, time) {
    history.unshift({ method, path, status, time, ts: Date.now() });
    if (history.length > 50) history = history.slice(0, 50);
    localStorage.setItem('api_tester_history', JSON.stringify(history));
    renderHistory();
}

function clearHistory() {
    history = [];
    localStorage.setItem('api_tester_history', '[]');
    renderHistory();
}

function renderHistory() {
    const list = document.getElementById('historyList');
    if (!history.length) {
        list.innerHTML = '<div class="history-empty">No requests yet</div>';
        return;
    }

    list.innerHTML = history.map((item, i) => `
        <div class="history-item" onclick="restoreFromHistory(${i})">
            <span class="history-method ${item.method}">${item.method}</span>
            <span class="history-path">${item.path}</span>
            <span class="history-status ${item.status >= 200 && item.status < 300 ? 'success' : 'error'}">${item.status || '—'}</span>
        </div>
    `).join('');
}

function restoreFromHistory(index) {
    const item = history[index];
    if (!item) return;
    document.getElementById('httpMethod').value = item.method;
    syncMethodColor();
    document.getElementById('requestPath').value = item.path;
}

// ─── Utilities ───
function syntaxHighlight(obj) {
    const json = JSON.stringify(obj, null, 2);
    return json.replace(
        /("(\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
        (match) => {
            let cls = 'json-number';
            if (/^"/.test(match)) {
                if (/:$/.test(match)) {
                    cls = 'json-key';
                } else {
                    cls = 'json-string';
                }
            } else if (/true|false/.test(match)) {
                cls = 'json-bool';
            } else if (/null/.test(match)) {
                cls = 'json-null';
            }
            return `<span class="${cls}">${match}</span>`;
        }
    );
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// ─── Keyboard Shortcut ───
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        sendRequest();
    }
});
