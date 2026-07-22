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

  useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])

  const handleConnectWhatsApp = async () => {
    setErrorMsg("")
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

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">Settings</h1>
        <p className="text-slate-500 mt-1 text-sm">Manage your company integrations and WhatsApp numbers.</p>
      </div>

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
          <button 
            className="flex items-center gap-2 px-4 py-2 bg-[#0056b3] text-white font-medium rounded-lg hover:bg-[#004494] transition-colors shadow-sm disabled:opacity-70"
            onClick={handleConnectZoho}
            disabled={isConnectingZoho}
          >
            {isConnectingZoho ? <Loader2 className="animate-spin" size={18} /> : null}
            {isConnectingZoho ? "Connecting..." : "Connect Zoho"}
          </button>
        </div>
        <div className="p-6 text-center text-slate-500">
          No Zoho account connected yet. Click the button above to connect.
        </div>
      </div>

      {/* Teams Section */}
      <div className="mt-6">
        <TeamsSection />
      </div>
    </div>
  )
}
