import { useState, useEffect } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import axios from 'axios';
import Y2KWindow from './Y2KWindow';
import { API_URL } from '../config';

interface Department {
  id: number;
  name: string;
}

interface Municipality {
  id: number;
  name: string;
  department: number;
}

interface FormData {
  nombres: string;
  apellidos: string;
  cedula: string;
  email: string;
  phone: string;
  sexo: string;
  department_id: string | number;
  municipio_id: string | number;
  referrer_code: string;
  id?: number;
}

const RegistrationForm = ({ onBack }: { onBack?: () => void }) => {
  const [formData, setFormData] = useState<FormData>({
    nombres: '',
    apellidos: '',
    cedula: '',
    email: '',
    phone: '',
    sexo: '',
    department_id: '',
    municipio_id: '',
    referrer_code: ''
  });

  const [departments, setDepartments] = useState<Department[]>([]);
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [referrerName, setReferrerName] = useState('');
  const [isReferralValid, setIsReferralValid] = useState(false);

  const [verificationState, setVerificationState] = useState({
    step: 'initial',
    phoneHint: '',
    challengePhone: '',
    challengeEmail: '',
    error: ''
  });
  const [copied, setCopied] = useState(false);

  const [message, setMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [successData, setSuccessData] = useState<{ referral_code: string } | null>(null);

  useEffect(() => {
    if (Object.keys(fieldErrors).length > 0) {
      const firstErrorField = Object.keys(fieldErrors)[0];
      const element = document.getElementsByName(firstErrorField)[0];
      if (element) {
        (element as HTMLElement).focus();
      }
    }
  }, [fieldErrors]);

  useEffect(() => {
    fetchDepartments();
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get('ref');
    if (refCode) {
      checkReferrer(refCode);
    }
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await axios.get(`${API_URL}/locations/`);
      setDepartments(response.data);
    } catch (error) {
      console.error('Error loading departments', error);
    }
  };

  const fetchMunicipalities = async (deptId: string | number) => {
    try {
      const response = await axios.get(`${API_URL}/locations/${deptId}/municipalities/`);
      setMunicipalities(response.data);
    } catch (error) {
      console.error('Error loading municipalities', error);
    }
  };

  const checkReferrer = async (code: string) => {
    try {
      const response = await axios.get(`${API_URL}/sympathizers/referrer/${code}/`);
      setReferrerName(`${response.data.nombres} ${response.data.apellidos}`);
      setIsReferralValid(true);
      setFormData(prev => ({ ...prev, referrer_code: code }));
    } catch (error) {
      console.error('Invalid referral code');
      setIsReferralValid(false);
    }
  };

  const handleCedulaBlur = async () => {
    if (!formData.cedula) return;

    try {
      const response = await axios.post(`${API_URL}/sympathizers/check_cedula/`, { cedula: formData.cedula });
      if (response.data.exists) {
        setVerificationState({
          step: 'challenge',
          phoneHint: response.data.phone_hint,
          challengePhone: '',
          challengeEmail: '',
          error: ''
        });
      }
    } catch (error) {
      console.error('Error checking cedula', error);
    }
  };

  const handleVerify = async () => {
    try {
      const response = await axios.post(`${API_URL}/sympathizers/verify_identity/`, {
        cedula: formData.cedula,
        phone: verificationState.challengePhone,
        email: verificationState.challengeEmail
      });

      if (response.data.verified) {
        const data = response.data.data;
        setFormData({
          ...formData,
          id: data.id,
          nombres: data.nombres,
          apellidos: data.apellidos,
          email: data.email || '',
          phone: data.phone,
          sexo: data.sexo,
          department_id: data.department_id || '',
          municipio_id: data.municipio_id || ''
        });
        if (data.department_id) {
            fetchMunicipalities(data.department_id);
        }
        setVerificationState({ ...verificationState, step: 'verified', error: '' });
      }
    } catch (error) {
      setVerificationState({ ...verificationState, error: 'Verificación fallida. Los datos no coinciden.' });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
        if (verificationState.step === 'verified') {
             if (!formData.id) {
                 setFieldErrors({ general: ["Error interno: ID no encontrado para actualización."] });
                 return;
             }
             // eslint-disable-next-line @typescript-eslint/no-unused-vars
             const { referrer_code, ...updateData } = formData;

             const response = await axios.put(`${API_URL}/sympathizers/${formData.id}/`, updateData);
             setSuccessData(response.data);
             setMessage('Actualización exitosa');
             return;
        }

      const response = await axios.post(`${API_URL}/sympathizers/`, formData);
      setSuccessData(response.data);
      setMessage('Registro exitoso!');
      setFieldErrors({});

      setFormData({
        nombres: '',
        apellidos: '',
        cedula: '',
        email: '',
        phone: '',
        sexo: '',
        department_id: '',
        municipio_id: '',
        referrer_code: formData.referrer_code
      });
      setReferrerName('');

    } catch (error: any) {
      console.error('Error registering', error);
      if (error.response && error.response.status === 400) {
        setFieldErrors(error.response.data);
        setMessage('');
      } else {
        setMessage('Error en el registro. Verifique los datos.');
      }
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'department_id') {
      fetchMunicipalities(value);
      setFormData(prev => ({ ...prev, municipio_id: '' }));
    }
  };

  return (
    <div className="bg-secondary min-h-screen flex items-center justify-center p-3 sm:p-4 font-sans relative">

      <Y2KWindow title="Registro" onBack={onBack} className="w-full max-w-4xl mx-2 sm:mx-0" contentClassName="p-4 sm:p-5">
            {isReferralValid ? (
            <div className="bg-pearl-aqua/20 border-2 border-pearl-aqua text-black p-3 sm:p-4 mb-4 shadow-sm" role="alert">
                <p className="font-bold text-lg">¡Bienvenido!</p>
                <p>Has sido referenciado por: <span className="font-bold text-primary">{referrerName}</span></p>
            </div>
            ) : (
            <div className="bg-white/50 border-2 border-primary text-black p-3 sm:p-4 mb-4 shadow-sm" role="alert">
                <p className="font-bold text-lg">¡Bienvenido!</p>
                <p>Empieza a construir un futuro con nosotros.</p>
            </div>
            )}

            {Object.keys(fieldErrors).length > 0 && (
              <div className="bg-white/70 border-2 border-primary text-primary p-3 sm:p-4 mb-4 shadow-sm" role="alert">
                <p className="font-bold text-base sm:text-lg mb-2">Por favor corrija los siguientes errores:</p>
                <ul className="list-disc list-inside">
                  {Object.entries(fieldErrors).map(([field, errors]) => (
                    <li key={field}>
                      <span className="font-bold uppercase">{field}:</span> {errors.join(', ')}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {isReferralValid && (
                  <div className="sm:col-span-2">
                    <label className="block text-sm sm:text-base font-semibold text-black mb-1">Referenciado por</label>
                    <input
                      type="text"
                      value={referrerName}
                      readOnly
                      className="block w-full bg-white text-black border-2 border-black/10 focus:border-dark-periwinkle focus:ring-0 text-base p-2.5 sm:p-3 cursor-not-allowed opacity-70"
                    />
                  </div>
                )}
                <div className="sm:col-span-2">
                  <label className="block text-sm sm:text-base font-semibold text-black mb-1">C?dula *</label>
                  <input
                    type="text"
                    name="cedula"
                    value={formData.cedula}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      setFormData({ ...formData, cedula: val });
                    }}
                    onBlur={handleCedulaBlur}
                    required
                    className="block w-full bg-white text-black border-2 border-black/20 focus:border-dark-periwinkle focus:ring-0 text-base p-2.5 sm:p-3 placeholder-gray-500 shadow-inner"
                    placeholder="Ingrese solo n?meros"
                  />
                </div>
                <div>
                  <label className="block text-sm sm:text-base font-semibold text-black mb-1">Nombres *</label>
                  <input
                    type="text"
                    name="nombres"
                    value={formData.nombres}
                    onChange={handleChange}
                    required
                    className="block w-full bg-white text-black border-2 border-black/20 focus:border-dark-periwinkle focus:ring-0 text-base p-2.5 sm:p-3 shadow-inner"
                  />
                </div>
                <div>
                  <label className="block text-sm sm:text-base font-semibold text-black mb-1">Apellidos *</label>
                  <input
                    type="text"
                    name="apellidos"
                    value={formData.apellidos}
                    onChange={handleChange}
                    required
                    className="block w-full bg-white text-black border-2 border-black/20 focus:border-dark-periwinkle focus:ring-0 text-base p-2.5 sm:p-3 shadow-inner"
                  />
                </div>
                <div>
                  <label className="block text-sm sm:text-base font-semibold text-black mb-1">Sexo *</label>
                  <select
                    name="sexo"
                    value={formData.sexo}
                    onChange={handleChange}
                    required
                    className="block w-full bg-white text-black border-2 border-black/20 focus:border-dark-periwinkle focus:ring-0 text-base p-2.5 sm:p-3 shadow-inner appearance-none"
                  >
                    <option value="">Seleccione...</option>
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                    <option value="O">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm sm:text-base font-semibold text-black mb-1">Tel?fono *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                      setFormData({ ...formData, phone: val });
                    }}
                    required
                    placeholder="10 d?gitos"
                    className="block w-full bg-white text-black border-2 border-black/20 focus:border-dark-periwinkle focus:ring-0 text-base p-2.5 sm:p-3 shadow-inner"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm sm:text-base font-semibold text-black mb-1">
                    Correo electr?nico <span className="text-black/50 font-normal">(opcional)</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="ejemplo@correo.com"
                    className="block w-full bg-white text-black border-2 border-black/20 focus:border-dark-periwinkle focus:ring-0 text-base p-2.5 sm:p-3 shadow-inner"
                  />
                </div>
                <div>
                  <label className="block text-sm sm:text-base font-semibold text-black mb-1">
                    Departamento <span className="text-black/50 font-normal">(opcional)</span>
                  </label>
                  <select
                    name="department_id"
                    value={formData.department_id}
                    onChange={handleChange}
                    className="block w-full bg-white text-black border-2 border-black/20 focus:border-dark-periwinkle focus:ring-0 text-base p-2.5 sm:p-3 shadow-inner appearance-none"
                  >
                    <option value="">Seleccione...</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm sm:text-base font-semibold text-black mb-1">
                    Municipio <span className="text-black/50 font-normal">(opcional)</span>
                  </label>
                  <select
                    name="municipio_id"
                    value={formData.municipio_id}
                    onChange={handleChange}
                    disabled={!formData.department_id}
                    className="block w-full bg-white text-black border-2 border-black/20 focus:border-dark-periwinkle focus:ring-0 text-base p-2.5 sm:p-3 shadow-inner disabled:bg-white/50 disabled:text-gray-400 appearance-none"
                  >
                    <option value="">Seleccione...</option>
                    {municipalities.map(mun => (
                      <option key={mun.id} value={mun.id}>{mun.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                type="submit"
                disabled={verificationState.step === "challenge"}
                className="w-full sm:w-1/2 lg:w-1/3 mx-auto rounded-full flex justify-center py-3 px-4 border-2 border-primary text-base sm:text-lg font-black text-primary bg-white hover:bg-primary hover:text-white hover:border-primary focus:outline-none focus:ring-0 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-0 mt-2 sm:mt-4 uppercase tracking-wide shadow-md"
              >
                Registrar
              </button>
              {message && !successData && (
                <div className={`mt-4 p-3 sm:p-4 border-2 text-sm sm:text-base ${message.includes("exitoso") ? "bg-pearl-aqua/20 text-black border-pearl-aqua" : "bg-racing-red/20 text-black border-white"}`}>
                  <p className="font-bold text-center uppercase">{message}</p>
                </div>
              )}
            </form>
      </Y2KWindow>

      {/* Verification Modal */}
      {verificationState.step === 'challenge' && (
        <Y2KWindow title="Verificación" onClose={() => setVerificationState({...verificationState, step: 'initial'})}>
          <div className="space-y-4">
            <p className="text-sm text-black mb-5 font-medium">
                Este número de cédula ya está registrado. Para actualizar sus datos, verifique su identidad ingresando el número de teléfono asociado (terminado en <span className="font-mono font-bold bg-pearl-aqua px-2 py-0.5 text-black">{verificationState.phoneHint}</span>).
            </p>

            {verificationState.error && (
              <div className="bg-white/70 border-2 border-primary text-primary p-3 mb-4 text-sm font-bold uppercase text-center">
                {verificationState.error}
              </div>
            )}

            <input
                type="text"
                placeholder="Número de teléfono completo"
                value={verificationState.challengePhone}
                onChange={(e) => setVerificationState({...verificationState, challengePhone: e.target.value})}
                className="block w-full bg-white text-black border-2 border-black/20 focus:border-dark-periwinkle focus:ring-0 sm:text-sm p-3"
            />
            <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t-2 border-black/10"></div>
                <span className="flex-shrink-0 mx-4 text-black/60 text-xs uppercase font-bold">O verificar con correo</span>
                <div className="flex-grow border-t-2 border-black/10"></div>
            </div>
            <input
                type="email"
                placeholder="Correo electrónico asociado"
                value={verificationState.challengeEmail}
                onChange={(e) => setVerificationState({...verificationState, challengeEmail: e.target.value})}
                className="block w-full bg-white text-black border-2 border-black/20 focus:border-dark-periwinkle focus:ring-0 sm:text-sm p-3"
            />
            <button
                type="button"
                onClick={handleVerify}
                className="w-full rounded-full flex justify-center py-3 px-4 border-2 border-primary text-lg font-black text-primary bg-white hover:bg-primary hover:text-white hover:border-primary focus:outline-none focus:ring-0 transition-colors duration-0 uppercase tracking-widest shadow-md"
            >
                Verificar Identidad
            </button>
          </div>
        </Y2KWindow>
      )}

      {/* Success Modal */}
      {successData && (
        <Y2KWindow title={message.includes('Actualización') ? "Actualización Exitosa" : "Registro Exitoso"}>
          <div className="text-center space-y-6">
            <div className="bg-pearl-aqua/20 border-2 border-pearl-aqua text-black p-6 shadow-lg">
              <h2 className="text-2xl font-black uppercase mb-4 text-dark-amathyst">
                {message.includes('Actualización') ? "¡Datos Actualizados!" : "¡Bienvenido a la red!"}
              </h2>
              <p className="text-sm mb-4 font-medium">
                {message.includes('Actualización')
                  ? "Tus datos han sido actualizados correctamente. Comparte tu enlace para invitar a otros:"
                  : "Comparte tu enlace para invitar a otros:"}
              </p>

              <div className="flex items-center gap-2">
                <div className="bg-white border-2 border-black/10 p-3 flex-grow font-mono text-xs overflow-hidden text-ellipsis whitespace-nowrap">
                  {`${window.location.origin}?ref=${successData.referral_code}`}
                </div>

                <div className="flex gap-1 shrink-0">
                  <button
                    title="Compartir en WhatsApp"
                    onClick={() => {
                      const url = `${window.location.origin}?ref=${successData.referral_code}`;
                      const text = `¡Únete a mi red! Regístrate aquí: ${url}`;
                      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                    }}
                    className="w-10 h-10 flex items-center justify-center bg-[#25D366] text-white border-2 border-transparent hover:border-black hover:bg-[#128C7E] transition-colors"
                  >
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                  </button>

                  <button
                    title="Compartir en Gmail"
                    onClick={() => {
                      const url = `${window.location.origin}?ref=${successData.referral_code}`;
                      const subject = "Invitación a unirse";
                      const body = `¡Hola! Te invito a unirte a mi red. Regístrate aquí: ${url}`;
                      window.open(`https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
                    }}
                    className="w-10 h-10 flex items-center justify-center bg-[#EA4335] text-white border-2 border-transparent hover:border-black hover:bg-[#B93227] transition-colors"
                  >
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/></svg>
                  </button>

                  <button
                    title="Copiar URL"
                    onClick={() => {
                      const url = `${window.location.origin}?ref=${successData.referral_code}`;
                      navigator.clipboard.writeText(url);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className={`w-10 h-10 flex items-center justify-center border-2 border-transparent transition-colors ${copied ? 'bg-pearl-aqua text-black border-black' : 'bg-white text-gray hover:border-black hover:bg-gray-200'}`}
                  >
                    {copied ? (
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    ) : (
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="text-sm font-bold text-black/60 hover:text-black uppercase tracking-widest underline decoration-2 underline-offset-4"
            >
              Volver al inicio
            </button>
          </div>
        </Y2KWindow>
      )}
    </div>
  );
};

export default RegistrationForm;
