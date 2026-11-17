import { useState, useEffect } from 'react'
import { Snowflake, Lock, ArrowLeft, Mail, ShieldCheck, Wifi, Users, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { usuarios } from '../data/mockData'
import { login as apiLogin, verificar2FA } from '../services/authService'
import { PASS } from '../data/mockData'
import logoJGFrio from '../img/logo-jgfrio.png'

const rolIcon = { encargado: ShieldCheck, ventas: Users, tecnico: Wifi, admin: Lock }
const rolColor = { encargado: 'bg-amber-400', ventas: 'bg-emerald-400', tecnico: 'bg-cyan-400', admin: 'bg-indigo-400' }

export default function Login({ onOk, onBack }) {
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [pend, setPend] = useState(false)
  const [tempToken, setTempToken] = useState(null)
  const [code, setCode] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [blockedSeconds, setBlockedSeconds] = useState(0)
  const [codigoPreview, setCodigoPreview] = useState(null)

  useEffect(() => {
    if (blockedSeconds <= 0) return
    const id = setInterval(() => {
      setBlockedSeconds(s => {
        if (s <= 1) { clearInterval(id); return 0 }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [blockedSeconds > 0])

  const submit = async e => {
    e.preventDefault()
    setLoading(true); setMsg('')
    try {
      const data = await apiLogin(email, pass)
      if (data.requiere2FA) {
        setPend(true); setTempToken(data.tempToken); setCodigoPreview(data.codigoPreview || null)
      } else { onOk(data.user) }
    } catch (err) {
      if (err.status === 423) {
        setBlockedSeconds(err.data?.segundosRestantes || 40)
      }
      setMsg(err.message)
    } finally { setLoading(false) }
  }
  const verify = async e => {
    e.preventDefault()
    setLoading(true); setMsg('')
    try { const data = await verificar2FA(code, tempToken); onOk(data.user) }
    catch (err) { setMsg(err.message) } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Columna izquierda: atmósfera industrial */}
      <div className="relative hidden lg:flex flex-col justify-between bg-slate-950 text-white p-12 overflow-hidden border-r border-slate-800/80">
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px] opacity-60" />
        <div className="pointer-events-none absolute -top-24 -left-24 w-80 h-80 bg-sky-500/20 rounded-full blur-[110px]" />
        <div className="pointer-events-none absolute -bottom-32 -right-24 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px]" />

        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-10">
            <img src={logoJGFrio} alt="JG Frío & Agroindustria" className="h-20 sm:h-24 w-auto object-contain scale-110 origin-left" />
            <span className="bg-sky-500/10 border border-sky-500/25 text-sky-300 text-xs font-medium px-3 py-1 rounded-full">Plataforma Operativa v2.0</span>
          </div>
          <h2 className="text-3xl xl:text-4xl font-extrabold tracking-tight leading-tight mb-4">
            Control inteligente de tu <span className="bg-gradient-to-r from-sky-400 to-cyan-300 bg-clip-text text-transparent">cadena de frío industrial</span>
          </h2>
          <p className="text-slate-300 mb-8 max-w-md">Gestión integral de servicios técnicos, cotizaciones y trazabilidad para plantas agroindustriales, cárnicas, pesqueras y lácteas.</p>
          <div className="space-y-3 max-w-md">
            {[
              { icon: ShieldCheck, t: 'Control de acceso por roles (RBAC)' },
              { icon: Lock, t: 'Autenticación en dos pasos (2FA)' },
              { icon: Wifi, t: 'Sincronización offline en terreno' },
            ].map(({ icon: Ic, t }) => (
              <div key={t} className="flex items-center gap-3.5 bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 rounded-xl p-3.5 transition">
                <div className="bg-sky-500/15 text-sky-400 p-2 rounded-lg"><Ic size={18} /></div>
                <span className="text-slate-200 text-sm font-medium">{t}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex items-center justify-between max-w-md">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
            </span>
            <span className="text-sm text-slate-200 font-medium">Servicios Cloud & Base de Datos Operativos</span>
          </div>
          <span className="font-mono text-[11px] text-slate-400 tracking-wider">TLS 1.3 · JWT</span>
        </div>
      </div>

      {/* Columna derecha */}
      <div className="relative bg-slate-50 flex items-center justify-center p-6 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] [background-size:32px_32px] opacity-60 pointer-events-none" />
        <button onClick={onBack} className="group absolute top-6 right-6 inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-950 bg-white/90 backdrop-blur border border-slate-200/90 px-4 py-2 rounded-full shadow-sm hover:shadow transition z-10">
          <ArrowLeft size={14} className="transition group-hover:-translate-x-0.5" /> Volver al inicio
        </button>

        <div className="relative z-10 w-full max-w-[440px] bg-white rounded-2xl shadow-[0_20px_50px_rgba(15,23,42,0.08)] border border-slate-200/80 overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-sky-500 via-blue-600 to-cyan-400" />
          <div className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-br from-sky-500 to-blue-600 text-white p-2.5 rounded-xl shadow-md shadow-sky-500/25">
                <Snowflake size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Acceso personal</h2>
                <small className="text-slate-500">Ingresa tus credenciales corporativas</small>
              </div>
            </div>

            {blockedSeconds > 0 && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-semibold">
              Cuenta bloqueada temporalmente. Reintenta en {blockedSeconds}s.
            </div>
          )}
          {pend ? (
              <form onSubmit={verify} className="space-y-4">
                <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 flex items-center gap-3">
                  <ShieldCheck size={20} className="text-sky-600 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Verificación en dos pasos</p>
                    <p className="text-xs text-slate-500">Ingresa el código de 6 dígitos válido por 3 minutos</p>
                  </div>
                </div>
                {codigoPreview && (
                  <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-xl px-4 py-3 text-xs">
                    Código generado por el servidor (modo demo sin SMTP): <span className="font-mono font-bold">{codigoPreview}</span>
                  </div>
                )}
                <input type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(e) => { const soloDigitos = e.target.value.replace(/\D/g, '').slice(0, 6); setCode(soloDigitos) }} placeholder="••••••" className="text-center text-2xl font-mono font-bold tracking-[0.5em] h-14" />
                <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-slate-900 to-slate-800 hover:from-sky-500 hover:to-blue-600 text-white hover:text-slate-950 font-bold py-3.5 rounded-xl shadow-lg transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading ? 'Verificando...' : (<>Confirmar código <ArrowRight size={16} /></>)}
                </button>
              </form>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700">Correo</label>
                  <div className="relative mt-1">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input value={email} onChange={e => setEmail(e.target.value)} placeholder="correo@jgfrio.test" className="pl-10" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700">Contraseña</label>
                  <div className="relative mt-1">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type={showPass ? 'text' : 'password'} value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••" className="pl-10 pr-10" />
                    <button type="button" onClick={() => setShowPass(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <button disabled={loading || blockedSeconds > 0} className="group w-full bg-gradient-to-r from-slate-900 to-slate-800 hover:from-sky-500 hover:to-blue-600 text-white hover:text-slate-950 font-bold py-3.5 rounded-xl shadow-lg transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading ? 'Ingresando...' : (<>Ingresar <ArrowRight size={16} className="transition group-hover:translate-x-1" /></>)}
                </button>

                <div className="pt-2">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex-1 h-px bg-slate-200" />
                    <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">Acceso rápido · Perfiles de evaluación</span>
                    <div className="flex-1 h-px bg-slate-200" />
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    {usuarios.slice(0, 4).map(u => {
                      const Ic = rolIcon[u.rol] || Users
                      return (
                        <button type="button" key={u.email} onClick={() => { setEmail(u.email); setPass(PASS) }}
                          className="group text-left border border-slate-200 hover:border-sky-400 hover:bg-sky-50/50 hover:shadow-sm rounded-lg p-2.5 transition">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${rolColor[u.rol] || 'bg-slate-400'}`} />
                            <Ic size={13} className="text-sky-600" />
                            <span className="text-xs font-bold text-slate-900 capitalize">{u.rol}</span>
                          </div>
                          <div className="font-mono text-[11px] text-slate-400 truncate mt-1">{u.tecId ? u.nombre : u.email}</div>
                        </button>
                      )
                    })}
                    {usuarios[4] && (
                      <button type="button" onClick={() => { setEmail(usuarios[4].email); setPass(PASS) }}
                        className="group col-span-2 text-left border border-slate-200 hover:border-sky-400 hover:bg-sky-50/50 hover:shadow-sm rounded-lg p-2.5 transition">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${rolColor[usuarios[4].rol] || 'bg-slate-400'}`} />
                          <Lock size={13} className="text-sky-600" />
                          <span className="text-xs font-bold text-slate-900 capitalize">{usuarios[4].rol}</span>
                        </div>
                        <div className="font-mono text-[11px] text-slate-400 truncate mt-1">{usuarios[4].email}</div>
                      </button>
                    )}
                  </div>
                </div>
              </form>
            )}
            {msg && <p className="text-red-600 text-sm mt-4">{msg}</p>}
          </div>
        </div>
      </div>
    </div>
  )
}