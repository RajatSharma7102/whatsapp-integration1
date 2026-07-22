import { useEffect, useState } from "react"
import { useWhatsAppStore } from "@/store/whatsappStore"
import { launchWhatsAppSignup } from "@/lib/facebookSdk"
import { Phone, CheckCircle2, XCircle, Loader2, Star, MessageSquare, PowerOff, Mail, Plus } from "lucide-react"
import { TeamsSection } from "@/components/TeamsSection"
import api from "@/lib/api"

export default function Settings() {
  const { accounts, isLoading, fetchAccounts, connectAccount } = useWhatsAppStore()
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnectingZoho, setIsConnectingZoho] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const [successMsg, setSuccessMsg] = useState("")
  const [zohoStatus, setZohoStatus] = useState<any>(null)
  const [isLoadingZohoStatus, setIsLoadingZohoStatus] = useState(true)

  const [isConnectingEmail, setIsConnectingEmail] = useState(false)
  const [isEmailMenuOpen, setIsEmailMenuOpen] = useState(false)
  const [connectedEmails, setConnectedEmails] = useState<any[]>([])
  
  const [showSmtpModal, setShowSmtpModal] = useState(false)
  const [smtpForm, setSmtpForm] = useState({
    email: '',
    smtpHost: '',
    smtpPort: '',
    smtpUsername: '',
    smtpPassword: ''
  })

  const loadEmailAccounts = async () => {
    try {
      const res = await api.get('/email/accounts')
      setConnectedEmails(res.data.data || [])
    } catch (error) {
      console.error("Failed to load email accounts", error)
    }
  }

  const loadZohoStatus = async () => {
    try {
      setIsLoadingZohoStatus(true)
      const res = await api.get('/integrations/zoho/status')
      setZohoStatus(res.data)
    } catch (error) {
      console.error("Failed to load Zoho status", error)
    } finally {
      setIsLoadingZohoStatus(false)
    }
  }

  useEffect(() => {
    fetchAccounts()
    loadZohoStatus()
    loadEmailAccounts()

    const urlParams = new URLSearchParams(window.location.search)
    
    // Check for zoho_connected in URL
    if (urlParams.get('zoho_connected') === 'true') {
      setSuccessMsg("Zoho CRM connected successfully!")
      urlParams.delete('zoho_connected')
      const newUrl = urlParams.toString() ? `${window.location.pathname}?${urlParams.toString()}` : window.location.pathname
      window.history.replaceState({}, document.title, newUrl)
    }

    // Check for email_connected in URL
    if (urlParams.get('email_connected') === 'true') {
      setSuccessMsg("Email Account connected successfully!")
      urlParams.delete('email_connected')
      const newUrl = urlParams.toString() ? `${window.location.pathname}?${urlParams.toString()}` : window.location.pathname
      window.history.replaceState({}, document.title, newUrl)
    }
  }, [fetchAccounts])

  const handleConnectWhatsApp = async () => {
    setErrorMsg("")
    setSuccessMsg("")
    setIsConnecting(true)
    try {
      // 1. Launch FB SDK
      const fbPayload = await launchWhatsAppSignup()
      
      // 2. Send payload to our backend to create WhatsAppAccount
      await connectAccount(fbPayload)
      
      // 3. Refresh list
      await fetchAccounts()
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to connect WhatsApp account.")
    } finally {
      setIsConnecting(false)
    }
  }

  const handleConnectZoho = async () => {
    setIsConnectingZoho(true)
    setErrorMsg("")
    setSuccessMsg("")
    try {
      const response = await api.get('/integrations/zoho/connect')
      if (response.data?.authUrl) {
        window.location.href = response.data.authUrl
      } else {
        setErrorMsg("Failed to retrieve Zoho authorization URL.")
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || "Failed to initiate Zoho connection.")
    } finally {
      setIsConnectingZoho(false)
    }
  }

  const handleDisconnect = (accountId: string) => {
    // Stub for disconnect
    alert(`Disconnect feature for account ${accountId} coming soon!`);
  }

  const handleDisconnectZoho = async () => {
    if (!window.confirm("Are you sure you want to disconnect Zoho CRM?")) return;
    try {
      await api.delete('/integrations/zoho/disconnect')
      setSuccessMsg("Zoho CRM disconnected successfully!")
      loadZohoStatus()
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || "Failed to disconnect Zoho CRM.")
    }
  }

  const handleConnectEmail = async (provider: string) => {
    if (provider === 'SMTP') {
      setShowSmtpModal(true)
      setIsEmailMenuOpen(false)
      return
    }
    
    if (provider === 'Gmail') {
      setIsConnectingEmail(true)
      setErrorMsg("")
      try {
        const response = await api.get('/email/connect/gmail')
        if (response.data?.authUrl) {
          window.location.href = response.data.authUrl
        } else {
          setErrorMsg("Failed to retrieve Google authorization URL.")
          setIsConnectingEmail(false)
        }
      } catch (err: any) {
        setErrorMsg(err.response?.data?.message || err.message || "Failed to initiate Gmail connection.")
        setIsConnectingEmail(false)
      }
      setIsEmailMenuOpen(false)
      return
    }

    // Stub for other OAuth providers
    setIsConnectingEmail(true)
    setTimeout(() => {
      alert(`${provider} integration coming soon!`)
      setIsConnectingEmail(false)
      setIsEmailMenuOpen(false)
    }, 500)
  }

  const handleSmtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsConnectingEmail(true)
    setErrorMsg("")
    setSuccessMsg("")
    try {
      await api.post('/email/connect/smtp', smtpForm)
      setSuccessMsg("SMTP account connected successfully!")
      setShowSmtpModal(false)
      setSmtpForm({ email: '', smtpHost: '', smtpPort: '', smtpUsername: '', smtpPassword: '' })
      loadEmailAccounts()
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Failed to connect SMTP account")
    } finally {
      setIsConnectingEmail(false)
    }
  }

  const handleDisconnectEmail = async (id: string) => {
    if (!window.confirm("Are you sure you want to disconnect this email account?")) return;
    try {
      await api.delete(`/email/account/${id}`)
      setSuccessMsg("Email disconnected successfully!")
      loadEmailAccounts()
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Failed to disconnect Email account")
    }
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">Settings</h1>
        <p className="text-slate-500 mt-1 text-sm">Manage your company integrations and WhatsApp numbers.</p>
      </div>

      {successMsg && (
        <div className="p-4 mb-4 bg-emerald-50 text-emerald-700 text-sm border border-emerald-100 rounded-lg flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg("")} className="text-emerald-700 hover:text-emerald-900">
            <XCircle size={16} />
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Connected WhatsApp Accounts</h2>
            <p className="text-sm text-slate-500">Manage multiple WhatsApp numbers for your organization.</p>
          </div>
          <button 
            onClick={handleConnectWhatsApp}
            disabled={isConnecting}
            className="flex items-center gap-2 px-4 py-2 bg-[#25D366] text-white font-medium rounded-lg hover:bg-[#128C7E] transition-colors shadow-sm disabled:opacity-70"
          >
            {isConnecting ? <Loader2 className="animate-spin" size={18} /> : <Phone size={18} />}
            {isConnecting ? "Connecting..." : "Connect WhatsApp Number"}
          </button>
        </div>

        {errorMsg && (
          <div className="p-4 bg-red-50 text-red-600 text-sm border-b border-red-100">
            {errorMsg}
          </div>
        )}

        <div className="p-0">
          {isLoading && accounts.length === 0 ? (
            <div className="p-12 flex justify-center">
              <Loader2 className="animate-spin text-slate-400" size={32} />
            </div>
          ) : accounts.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              No WhatsApp accounts connected yet. Click the button above to get started.
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {accounts.map((account) => (
                <li key={account._id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                      <Phone size={24} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 text-lg">{account.displayName}</h3>
                      <p className="text-slate-500 text-sm font-medium">{account.phoneNumber}</p>
                      {account.department && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-md">
                          {account.department}
                        </span>
                      )}
                      
                      <div className="flex gap-4 mt-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Star size={14} className={account.qualityRating === 'GREEN' ? 'text-emerald-500' : 'text-amber-500'} /> 
                          {account.qualityRating || 'N/A'}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare size={14} /> 
                          {account.messagingLimit ? `${account.messagingLimit}/day` : 'Tier 1 (1k)'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {account.status === 'CONNECTED' ? (
                      <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200">
                        <CheckCircle2 size={14} /> Connected
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 text-xs font-semibold rounded-full border border-red-200">
                        <XCircle size={14} /> {account.status}
                      </span>
                    )}
                    <span className="text-xs text-slate-400 mb-2">
                      Added {new Date(account.connectedAt).toLocaleDateString()}
                    </span>
                    <button 
                      onClick={() => handleDisconnect(account._id)}
                      className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 transition-colors"
                    >
                      <PowerOff size={14} /> Disconnect
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Zoho Integration Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-6">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Zoho CRM Integration</h2>
            <p className="text-sm text-slate-500">Connect your Zoho CRM to sync leads and conversations.</p>
          </div>
          
          {isLoadingZohoStatus ? (
            <div className="h-10 w-32 bg-slate-100 animate-pulse rounded-lg"></div>
          ) : zohoStatus?.connected ? (
            <button 
              onClick={handleDisconnectZoho}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
            >
              <PowerOff size={18} className="text-red-500" />
              Disconnect
            </button>
          ) : (
            <button 
              className="flex items-center gap-2 px-4 py-2 bg-[#0056b3] text-white font-medium rounded-lg hover:bg-[#004494] transition-colors shadow-sm disabled:opacity-70"
              onClick={handleConnectZoho}
              disabled={isConnectingZoho}
            >
              {isConnectingZoho ? <Loader2 className="animate-spin" size={18} /> : null}
              {isConnectingZoho ? "Connecting..." : "Connect Zoho"}
            </button>
          )}
        </div>
        
        <div className="p-6">
          {isLoadingZohoStatus ? (
            <div className="flex items-center gap-4 animate-pulse">
              <div className="h-12 w-12 bg-slate-100 rounded-full"></div>
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-slate-100 rounded w-1/4"></div>
                <div className="h-3 bg-slate-100 rounded w-1/3"></div>
              </div>
            </div>
          ) : zohoStatus?.connected ? (
            <div className="flex items-center justify-between bg-slate-50 rounded-xl p-4 border border-slate-100">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">
                  Z
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-lg flex items-center gap-2">
                    Zoho CRM
                    <span className="flex items-center gap-1 px-2.5 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200">
                      <CheckCircle2 size={12} /> Connected
                    </span>
                  </h3>
                  <div className="text-slate-500 text-sm mt-1 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1">
                    <p>Account Name: <span className="font-medium text-slate-700">{zohoStatus.accountName || 'Unknown Org'}</span></p>
                    <p>Connected On: <span className="font-medium text-slate-700">{new Date(zohoStatus.connectedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span></p>
                    <p className="col-span-1 sm:col-span-2 text-xs text-slate-400">Org ID: {zohoStatus.organizationId || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-500 py-4">
              No Zoho account connected yet. Click the button above to connect.
            </div>
          )}
        </div>
      </div>

      {/* Email Integration Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-6">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">Email Integration</h2>
          <p className="text-sm text-slate-500">Connect your email accounts to sync communications.</p>
        </div>
        
        <div className="p-6">
          <div className="mb-8">
            <h3 className="text-md font-semibold text-slate-800 mb-4">Email Accounts</h3>
            
            <div className="relative inline-block">
              <button 
                onClick={() => setIsEmailMenuOpen(!isEmailMenuOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
              >
                <Plus size={18} />
                Connect Email
              </button>
              
              {isEmailMenuOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden z-10">
                  <button onClick={() => handleConnectEmail('Gmail')} className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-100 text-slate-700 font-medium">
                    Gmail
                  </button>
                  <button onClick={() => handleConnectEmail('Outlook')} className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-100 text-slate-700 font-medium">
                    Outlook
                  </button>
                  <button onClick={() => handleConnectEmail('SMTP')} className="w-full text-left px-4 py-3 hover:bg-slate-50 text-slate-700 font-medium">
                    SMTP
                  </button>
                </div>
              )}
            </div>
            {isConnectingEmail && <p className="text-sm text-slate-500 mt-3 flex items-center gap-2"><Loader2 className="animate-spin" size={14}/> Connecting...</p>}
          </div>

          <div>
            <h3 className="text-md font-semibold text-slate-800 mb-4">Connected Accounts</h3>
            {connectedEmails.length === 0 ? (
              <p className="text-sm text-slate-500 bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">No email accounts connected.</p>
            ) : (
              <ul className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                {connectedEmails.map(account => (
                  <li key={account._id} className="p-4 bg-slate-50 hover:bg-slate-100 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start sm:items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 shadow-sm shrink-0">
                        <Mail size={20} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 flex items-center gap-2 text-base">
                          {account.email}
                          {account.isDefault && (
                            <span className="px-2 py-0.5 bg-slate-200 text-slate-600 text-xs rounded-full font-medium">Default</span>
                          )}
                        </h4>
                        <div className="text-slate-500 text-sm mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                          <span>Provider : <span className="font-medium text-slate-700 capitalize">{account.provider}</span></span>
                          <span className="flex items-center gap-1">
                            Status : <span className="text-emerald-600 font-medium flex items-center gap-1 capitalize"><CheckCircle2 size={14} /> {account.status}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDisconnectEmail(account._id)}
                      className="text-slate-400 hover:text-red-500 transition-colors shrink-0 self-end sm:self-auto" 
                      title="Disconnect"
                    >
                      <PowerOff size={18} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
      
      {/* SMTP Modal */}
      {showSmtpModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">Connect SMTP Account</h3>
              <button onClick={() => setShowSmtpModal(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle size={20} />
              </button>
            </div>
            <form onSubmit={handleSmtpSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input type="email" required placeholder="sales@marketingbugs.in" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    value={smtpForm.email} onChange={e => setSmtpForm({...smtpForm, email: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">SMTP Host</label>
                  <input type="text" required placeholder="smtp.hostinger.com" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={smtpForm.smtpHost} onChange={e => setSmtpForm({...smtpForm, smtpHost: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">SMTP Port</label>
                  <input type="number" required placeholder="465" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={smtpForm.smtpPort} onChange={e => setSmtpForm({...smtpForm, smtpPort: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                  <input type="text" required placeholder="sales@marketingbugs.in" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={smtpForm.smtpUsername} onChange={e => setSmtpForm({...smtpForm, smtpUsername: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                  <input type="password" required placeholder="••••••••" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={smtpForm.smtpPassword} onChange={e => setSmtpForm({...smtpForm, smtpPassword: e.target.value})} />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setShowSmtpModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-50 font-medium rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={isConnectingEmail} className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-70">
                  {isConnectingEmail ? <Loader2 size={16} className="animate-spin" /> : null}
                  Test & Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Teams Section */}
      <div className="mt-6">
        <TeamsSection />
      </div>
    </div>
  )
}
