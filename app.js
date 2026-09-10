const express = require('express')
const path = require('path')
const session = require('express-session')
const flash = require('connect-flash')
const { engine } = require('express-handlebars')

const app = express()
const PORT = process.env.PORT || 8091
const API_BASE_URL = (
    process.env.API_BASE_URL || 'https://case-enterprise-architecture.onrender.com'
).replace(/\/$/, '')

app.engine('handlebars', engine({
    helpers: {
        currency(value) {
            return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
        },
        date(value) {
            return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(new Date(value))
        },
        eq(left, right) {
            return left === right
        }
    }
}))
app.set('view engine', 'handlebars')
app.set('views', path.join(__dirname, 'views'))
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))
app.use(session({
    secret: process.env.SESSION_SECRET || 'payaccount-local-development-secret',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 30 * 60 * 1000 }
}))
app.use(flash())
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg')
    res.locals.error_msg = req.flash('error_msg')
    res.locals.account = req.session.account || null
    next()
})

function requireAccount(req, res, next) {
    if (!req.session.account) {
        req.flash('error_msg', 'Conclua seu onboarding para acessar a conta.')
        return res.redirect('/onboarding')
    }
    next()
}

function parseAmount(value) {
    const normalized = String(value || '').replace(',', '.')
    const amount = Number(normalized)
    return Number.isFinite(amount) && amount > 0 ? Math.round(amount * 100) / 100 : null
}

async function apiRequest(path, options = {}) {
    let response
    try {
        response = await fetch(`${API_BASE_URL}${path}`, {
            ...options,
            headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
        })
    } catch (error) {
        throw new Error(`Não foi possível conectar ao serviço de conta em ${API_BASE_URL}.`)
    }

    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
        throw new Error(payload.detail || payload.message || 'O serviço de conta recusou a operação.')
    }
    return payload
}

app.get('/', (req, res) => {
    res.render('home')
})

app.get('/onboarding', (req, res) => {
    res.render('onboarding/start')
})

app.post('/onboarding', async (req, res) => {
    const { name, email, document, birthDate, acceptedTerms } = req.body
    if (!name || !email || !document || !birthDate || !acceptedTerms) {
        req.flash('error_msg', 'Preencha todos os campos e aceite os termos para continuar.')
        return res.redirect('/onboarding')
    }

    try {
        const createdAccount = await apiRequest('/accounts', {
            method: 'POST',
            body: JSON.stringify({ initial_balance: 0 })
        })
        req.session.account = {
            apiAccountId: createdAccount.account_id,
            name: name.trim(),
            email: email.trim().toLowerCase(),
            document: document.trim(),
            birthDate,
            status: 'active',
            balance: createdAccount.balance,
            transactions: [],
            createdAt: new Date().toISOString()
        }
    } catch (error) {
        req.flash('error_msg', error.message)
        return res.redirect('/onboarding')
    }
    req.flash('success_msg', 'Conta criada. Seu onboarding foi concluído com sucesso.')
    res.redirect('/account')
})

app.get('/account', requireAccount, (req, res) => {
    const account = req.session.account
    res.render('account/dashboard', {
        account,
        transactions: [...account.transactions].reverse(),
        hasTransactions: account.transactions.length > 0
    })
})

app.post('/account/transactions', requireAccount, async (req, res) => {
    const { type, description } = req.body
    const amount = parseAmount(req.body.amount)
    const account = req.session.account

    if (!amount || !['credit', 'debit'].includes(type)) {
        req.flash('error_msg', 'Informe um valor válido e escolha crédito ou débito.')
        return res.redirect('/account')
    }
    if (type === 'debit' && amount > account.balance) {
        req.flash('error_msg', 'Saldo insuficiente para realizar este débito.')
        return res.redirect('/account')
    }

    try {
        const operation = type === 'credit' ? 'credit' : 'debit'
        const result = await apiRequest(`/accounts/${account.apiAccountId}/${operation}`, {
            method: 'POST',
            body: JSON.stringify({ amount })
        })
        account.balance = result.new_balance
        account.transactions.push({
            id: Date.now(),
            type,
            amount,
            description: description ? description.trim() : type === 'credit' ? 'Crédito em conta' : 'Débito em conta',
            createdAt: new Date().toISOString(),
            balanceAfter: account.balance
        })
    } catch (error) {
        req.flash('error_msg', error.message)
        return res.redirect('/account')
    }
    req.flash('success_msg', type === 'credit' ? 'Crédito lançado na conta.' : 'Débito lançado na conta.')
    res.redirect('/account')
})

app.post('/account/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/'))
})

app.use((req, res) => res.status(404).render('404'))

app.listen(PORT, () => {
    console.log(`PayAccount running at http://localhost:${PORT}`)
})
