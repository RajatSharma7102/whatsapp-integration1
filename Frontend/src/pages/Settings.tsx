import { useEffect, useState } from "react"
import { useWhatsAppStore } from "@/store/whatsappStore"
import { launchWhatsAppSignup } from "@/lib/facebookSdk"
import { Phone, CheckCircle2, XCircle, Loader2, Star, MessageSquare, PowerOff } from "lucide-react"
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

    // Check for zoho_connected in URL
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('zoho_connected') === 'true') {
      setSuccessMsg("Zoho CRM connected successfully!")
      window.history.replaceState({}, document.title, window.location.pathname)
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

      {/* Teams Section */}
      <div className="mt-6">
        <TeamsSection />
      </div>
    </div>
  )
}
