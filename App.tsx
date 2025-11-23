import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, User, Phone, Mail, Smartphone, MessageCircle, 
  Package, Calculator, Truck, CreditCard, FileText, 
  Settings, Eye, Share2, Printer, Plus, Trash2, Wand2
} from 'lucide-react';
import { 
  Company, Client, QuoteItem, QuoteConfig, FreightType, PaymentMethod 
} from './types';
import { 
  formatCurrency, extractColorsFromImage, fetchCNPJData, calculateDistanceMock 
} from './services/utils';
import { enhanceItemDescription } from './services/geminiService';

// --- Sub-components for better organization within single file structure ---

interface IconWrapperProps {
  children?: React.ReactNode;
  label: string;
}

const IconWrapper = ({ children, label }: IconWrapperProps) => (
  <div className="flex flex-col items-center gap-1 text-gray-500">
    {children}
    <span className="text-xs">{label}</span>
  </div>
);

interface InputGroupProps {
  label: string;
  children?: React.ReactNode;
  icon?: React.ReactNode;
}

const InputGroup = ({ label, children, icon }: InputGroupProps) => (
  <div className="flex flex-col gap-1 w-full">
    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
      {label}
    </label>
    <div className="relative">
        {children}
    </div>
    {icon && <div className="mt-1 flex gap-4 pl-2">{icon}</div>}
  </div>
);

function App() {
  // --- State ---
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [primaryColor, setPrimaryColor] = useState('#2563eb');
  
  const [company, setCompany] = useState<Company>({
    cnpj: '', name: '', email: '', phone: '', cell: '', whatsapp: '',
    address: { cep: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '' },
    logoUrl: '', primaryColor: '#2563eb', signatureUrl: ''
  });

  const [client, setClient] = useState<Client>({
    doc: '', name: '', email: '', phone: '', cell: '', whatsapp: '',
    address: { cep: '', street: '', number: '', neighborhood: '', city: '', state: '' },
    hideContacts: false
  });

  const [items, setItems] = useState<QuoteItem[]>([]);
  const [config, setConfig] = useState<QuoteConfig>({
    number: 1001,
    freightType: FreightType.CIF,
    deliveryDays: 5,
    deliveryType: 'DU',
    paymentMethod: PaymentMethod.PIX,
    boletoCondition: '',
    senderCep: '',
    receiverCep: '',
    distanceKm: 0,
    calculatedFreight: 0
  });

  // --- Effects ---
  useEffect(() => {
    // Update CSS variable for theme
    document.documentElement.style.setProperty('--primary-color', primaryColor);
  }, [primaryColor]);

  useEffect(() => {
    // Persist basic data (mock database)
    const savedItems = localStorage.getItem('savedItems');
    if (savedItems) {
        // In a real app, we'd load a catalog. Here we just know we have DB capability.
    }
  }, []);

  // --- Handlers ---

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const color = await extractColorsFromImage(url);
      setCompany(prev => ({ ...prev, logoUrl: url, primaryColor: color }));
      setPrimaryColor(color);
    }
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCompany(prev => ({ ...prev, signatureUrl: url }));
    }
  };

  const handleCompanyCNPJBlur = async () => {
    if (company.cnpj.length >= 14) {
      const data = await fetchCNPJData(company.cnpj);
      if (data) {
        setCompany(prev => ({
          ...prev,
          name: data.name,
          email: data.email,
          phone: data.phone,
          address: { ...prev.address, ...data.address }
        }));
        setConfig(prev => ({ ...prev, senderCep: data.address.cep }));
      }
    }
  };

  const handleClientDocBlur = async () => {
    if (client.doc.length >= 11) {
      const data = await fetchCNPJData(client.doc); // Using same API for CNPJ, would need different for CPF
      if (data) {
        setClient(prev => ({
          ...prev,
          name: data.name,
          email: data.email,
          phone: data.phone,
          address: { ...prev.address, ...data.address }
        }));
        setConfig(prev => ({ ...prev, receiverCep: data.address.cep }));
      }
    }
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        id: crypto.randomUUID(),
        name: '',
        ncm: '',
        packaging: '',
        quantity: 1,
        unitCost: 0,
        markup: 0,
        unitPrice: 0,
        totalPrice: 0
      }
    ]);
  };

  const updateItem = (id: string, field: keyof QuoteItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        let updated = { ...item, [field]: value };
        
        // Logic for Packaging (Uppercase, Alphanumeric max 8)
        if (field === 'packaging') {
            updated.packaging = String(value).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
        }

        // Calculation Logic
        if (field === 'unitCost' || field === 'markup' || field === 'quantity') {
           const cost = Number(field === 'unitCost' ? value : item.unitCost);
           const mark = Number(field === 'markup' ? value : item.markup);
           const qty = Number(field === 'quantity' ? value : item.quantity);
           
           const unitPrice = cost * (1 + (mark / 100));
           updated.unitCost = cost;
           updated.markup = mark;
           updated.quantity = qty;
           updated.unitPrice = unitPrice;
           updated.totalPrice = unitPrice * qty;
        }

        // Save to "DB"
        if (field === 'name' || field === 'packaging') {
             // Mock saving to local storage for future suggestions
             localStorage.setItem('last_items', JSON.stringify(updated));
        }

        return updated;
      }
      return item;
    }));
  };

  const removeItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  const enhanceDescription = async (id: string, currentName: string) => {
      if (!currentName) return;
      const improved = await enhanceItemDescription(currentName);
      updateItem(id, 'name', improved);
  };

  const calculateFreight = () => {
    const dist = calculateDistanceMock(config.senderCep, config.receiverCep);
    const cost = dist * 1.80;
    setConfig(prev => ({ ...prev, distanceKm: dist, calculatedFreight: cost }));
  };

  const getTotalValue = () => items.reduce((acc, item) => acc + item.totalPrice, 0);

  const getDiscountedTotal = () => {
      const total = getTotalValue() + config.calculatedFreight;
      return config.paymentMethod === PaymentMethod.PIX ? total * 0.9 : total;
  };

  // --- PDF Generation ---
  const generatePDF = async () => {
      // In a real scenario, we use ref to the preview div
      const element = document.getElementById('print-area');
      if (element) {
          // Temporarily show the element if hidden or ensure visible styles
          const canvas = await (window as any).html2canvas(element, { scale: 2 });
          const imgData = canvas.toDataURL('image/png');
          const pdf = new (window as any).jspdf.jsPDF('p', 'mm', 'a4');
          const imgProps = pdf.getImageProperties(imgData);
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
          pdf.save(`Cotacao_${config.number}_${client.name}.pdf`);
      }
  };

  const sendWhatsapp = () => {
      const text = `Olá, segue cotação #${config.number} para ${client.name}. Valor Total: ${formatCurrency(getTotalValue())}.`;
      window.open(`https://wa.me/${client.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
  };

  // --- Render ---

  return (
    <div className="min-h-screen font-sans text-slate-800 bg-gray-50 pb-20">
      {/* Navigation Bar */}
      <nav className="bg-white border-b sticky top-0 z-50 px-4 py-3 shadow-sm flex justify-between items-center no-print">
        <div className="flex items-center gap-2">
            <div className="bg-primary w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold">
                Q
            </div>
            <h1 className="font-bold text-xl text-gray-800">SmartQuote</h1>
        </div>
        <div className="flex gap-2">
             <button 
                onClick={() => setActiveTab('edit')}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${activeTab === 'edit' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-500 hover:bg-gray-100'}`}
             >
                <Settings size={18} /> Editor
             </button>
             <button 
                onClick={() => setActiveTab('preview')}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${activeTab === 'preview' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-500 hover:bg-gray-100'}`}
             >
                <Eye size={18} /> Visualizar Proposta
             </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6">
        
        {/* EDIT MODE */}
        {activeTab === 'edit' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            
            {/* Company Section */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex justify-between items-start mb-6 border-b pb-4">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800">
                        <Building2 className="text-primary" /> Dados da Sua Empresa
                    </h2>
                    <div className="flex flex-col items-center">
                        <label className="cursor-pointer group relative">
                            <div className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50 group-hover:bg-gray-100 transition">
                                {company.logoUrl ? (
                                    <img src={company.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                                ) : (
                                    <span className="text-xs text-center text-gray-400 p-1">Logo</span>
                                )}
                            </div>
                            <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                        </label>
                        <span className="text-[10px] text-gray-400 mt-1">Extrai cor auto</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <InputGroup label="CNPJ (Auto-preencher)">
                        <input 
                            type="text" 
                            className="w-full p-2 border rounded-lg focus:ring-2 ring-primary outline-none" 
                            placeholder="00.000.000/0000-00"
                            value={company.cnpj}
                            onChange={e => setCompany({...company, cnpj: e.target.value})}
                            onBlur={handleCompanyCNPJBlur}
                        />
                    </InputGroup>
                    <InputGroup label="Razão Social">
                        <input 
                            type="text" 
                            className="w-full p-2 border rounded-lg bg-gray-50" 
                            value={company.name}
                            readOnly
                        />
                    </InputGroup>
                    <InputGroup label="Email Comercial" icon={<IconWrapper label="Email"><Mail size={16} /></IconWrapper>}>
                         <input 
                            type="email" 
                            className="w-full p-2 border rounded-lg" 
                            value={company.email}
                            onChange={e => setCompany({...company, email: e.target.value})}
                        />
                    </InputGroup>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                    <InputGroup label="Celular" icon={<IconWrapper label="Móvel"><Smartphone size={16} /></IconWrapper>}>
                        <input type="text" className="w-full p-2 border rounded-lg" value={company.cell} onChange={e => setCompany({...company, cell: e.target.value})} />
                    </InputGroup>
                    <InputGroup label="WhatsApp" icon={<IconWrapper label="WhatsApp"><MessageCircle size={16} className="text-green-500" /></IconWrapper>}>
                        <input type="text" className="w-full p-2 border rounded-lg" value={company.whatsapp} onChange={e => setCompany({...company, whatsapp: e.target.value})} />
                    </InputGroup>
                    <InputGroup label="Assinatura Digital (Padrão)">
                        <input type="file" className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" onChange={handleSignatureUpload} />
                    </InputGroup>
                </div>
            </section>

            {/* Client Section */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                 <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800">
                        <User className="text-primary" /> Dados do Cliente
                    </h2>
                    <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
                        <input type="checkbox" checked={client.hideContacts} onChange={e => setClient({...client, hideContacts: e.target.checked})} className="rounded text-primary focus:ring-primary" />
                        Ocultar contatos na proposta
                    </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <InputGroup label="CPF / CNPJ (Busca Auto)">
                        <input 
                            type="text" 
                            className="w-full p-2 border rounded-lg focus:ring-2 ring-primary outline-none" 
                            placeholder="Digite para buscar..."
                            value={client.doc}
                            onChange={e => setClient({...client, doc: e.target.value})}
                            onBlur={handleClientDocBlur}
                        />
                    </InputGroup>
                    <InputGroup label="Solicitante / Nome">
                        <input 
                            type="text" 
                            className="w-full p-2 border rounded-lg bg-gray-50" 
                            value={client.name}
                            onChange={e => setClient({...client, name: e.target.value})}
                        />
                    </InputGroup>
                     <InputGroup label="Email" icon={<IconWrapper label="Email"><Mail size={16} /></IconWrapper>}>
                         <input 
                            type="email" 
                            className="w-full p-2 border rounded-lg" 
                            value={client.email}
                            onChange={e => setClient({...client, email: e.target.value})}
                        />
                    </InputGroup>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                    <InputGroup label="Telefone Fixo" icon={<IconWrapper label="Fixo"><Phone size={16} /></IconWrapper>}>
                        <input type="text" className="w-full p-2 border rounded-lg" value={client.phone} onChange={e => setClient({...client, phone: e.target.value})} />
                    </InputGroup>
                    <InputGroup label="Celular" icon={<IconWrapper label="Móvel"><Smartphone size={16} /></IconWrapper>}>
                        <input type="text" className="w-full p-2 border rounded-lg" value={client.cell} onChange={e => setClient({...client, cell: e.target.value})} />
                    </InputGroup>
                    <InputGroup label="WhatsApp" icon={<IconWrapper label="WhatsApp"><MessageCircle size={16} className="text-green-500" /></IconWrapper>}>
                        <input type="text" className="w-full p-2 border rounded-lg" value={client.whatsapp} onChange={e => setClient({...client, whatsapp: e.target.value})} />
                    </InputGroup>
                </div>
            </section>

            {/* Items Section */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 overflow-hidden">
                <div className="flex justify-between items-center mb-6">
                     <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800">
                        <Package className="text-primary" /> Itens da Proposta
                    </h2>
                    <button onClick={addItem} className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition">
                        <Plus size={18} /> Adicionar Item
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                            <tr>
                                <th className="px-4 py-3 min-w-[50ch]">Item / Descrição</th>
                                <th className="px-4 py-3 w-32">NCM</th>
                                <th className="px-4 py-3 w-32">Emb (8 char)</th>
                                <th className="px-4 py-3 w-24">Qtd</th>
                                <th className="px-4 py-3 w-32">Vl. Unit</th>
                                <th className="px-4 py-3 w-32">Total</th>
                                <th className="px-4 py-3 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {items.map((item, index) => (
                                <React.Fragment key={item.id}>
                                    {/* Line 1: Main Client Info */}
                                    <tr className="hover:bg-gray-50 bg-white">
                                        <td className="px-4 pt-3 pb-1 align-top">
                                            <div className="flex gap-2">
                                                <input 
                                                    type="text" 
                                                    className="w-full p-1 border rounded bg-transparent" 
                                                    placeholder="Nome do produto"
                                                    value={item.name}
                                                    onChange={e => updateItem(item.id, 'name', e.target.value)}
                                                    maxLength={250}
                                                />
                                                <button 
                                                    onClick={() => enhanceDescription(item.id, item.name)}
                                                    className="text-purple-500 hover:text-purple-700 p-1"
                                                    title="Melhorar com IA"
                                                >
                                                    <Wand2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-4 pt-3 pb-1 align-top">
                                            <input type="text" className="w-full p-1 border rounded" value={item.ncm} onChange={e => updateItem(item.id, 'ncm', e.target.value)} />
                                        </td>
                                        <td className="px-4 pt-3 pb-1 align-top">
                                            <input type="text" className="w-full p-1 border rounded uppercase font-mono" maxLength={8} value={item.packaging} onChange={e => updateItem(item.id, 'packaging', e.target.value)} placeholder="CX000000" />
                                        </td>
                                        <td className="px-4 pt-3 pb-1 align-top">
                                            <input type="number" className="w-full p-1 border rounded" value={item.quantity} onChange={e => updateItem(item.id, 'quantity', e.target.value)} />
                                        </td>
                                        <td className="px-4 pt-3 pb-1 align-top font-medium text-gray-700">
                                            {formatCurrency(item.unitPrice)}
                                        </td>
                                        <td className="px-4 pt-3 pb-1 align-top font-bold text-gray-900">
                                            {formatCurrency(item.totalPrice)}
                                        </td>
                                        <td rowSpan={2} className="px-4 py-2 align-middle text-center border-b">
                                            <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600">
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                    {/* Line 2: Internal Costs */}
                                    <tr className="bg-yellow-50/50 border-b border-gray-200">
                                        <td colSpan={6} className="px-4 pb-3 pt-1">
                                            <div className="flex items-center gap-6 text-xs">
                                                <span className="font-bold text-yellow-800 uppercase tracking-wider">Composição de Preço (Interno):</span>
                                                <div className="flex items-center gap-2">
                                                    <label className="text-gray-600 font-medium">Custo Unit.:</label>
                                                    <input 
                                                        type="number" 
                                                        className="w-32 p-1 border rounded bg-white text-gray-700 border-yellow-200 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400" 
                                                        value={item.unitCost} 
                                                        onChange={e => updateItem(item.id, 'unitCost', e.target.value)} 
                                                    />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <label className="text-gray-600 font-medium">Markup (%):</label>
                                                    <input 
                                                        type="number" 
                                                        className="w-24 p-1 border rounded bg-white text-gray-700 border-yellow-200 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400" 
                                                        value={item.markup} 
                                                        onChange={e => updateItem(item.id, 'markup', e.target.value)} 
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                    {items.length === 0 && <div className="text-center py-8 text-gray-400">Nenhum item adicionado</div>}
                </div>
            </section>

            {/* Configs & Calculations */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                     <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800">
                        <Calculator className="text-primary" /> Condições & Frete
                    </h2>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Freight Calc (Internal) */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                            <Truck size={18} /> Calculadora de Frete (Interno)
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <InputGroup label="CEP Origem">
                                <input type="text" className="w-full p-2 border rounded" value={config.senderCep} onChange={e => setConfig({...config, senderCep: e.target.value})} />
                            </InputGroup>
                            <InputGroup label="CEP Destino">
                                <input type="text" className="w-full p-2 border rounded" value={config.receiverCep} onChange={e => setConfig({...config, receiverCep: e.target.value})} />
                            </InputGroup>
                        </div>
                        <div className="mt-4 flex justify-between items-center">
                            <button onClick={calculateFreight} className="bg-slate-700 text-white px-4 py-2 rounded text-sm hover:bg-slate-800">
                                Calcular (Distância * 1.80)
                            </button>
                            <div className="text-right">
                                <div className="text-xs text-gray-500">Distância: {config.distanceKm} km</div>
                                <div className="font-bold text-lg text-slate-800">{formatCurrency(config.calculatedFreight)}</div>
                            </div>
                        </div>
                    </div>

                    {/* Terms */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                             <InputGroup label="Tipo de Frete">
                                <select 
                                    className="w-full p-2 border rounded"
                                    value={config.freightType}
                                    onChange={e => setConfig({...config, freightType: e.target.value as FreightType})}
                                >
                                    <option value={FreightType.CIF}>CIF (Pago pelo Remetente)</option>
                                    <option value={FreightType.FOB}>FOB (Pago pelo Destinatário)</option>
                                </select>
                             </InputGroup>
                             <div className="flex gap-2">
                                <InputGroup label="Prazo Entrega">
                                    <input type="number" className="w-full p-2 border rounded" value={config.deliveryDays} onChange={e => setConfig({...config, deliveryDays: Number(e.target.value)})} />
                                </InputGroup>
                                <InputGroup label="Tipo Dias">
                                    <select className="w-full p-2 border rounded" value={config.deliveryType} onChange={e => setConfig({...config, deliveryType: e.target.value as any})}>
                                        <option value="DC">Dias Corridos</option>
                                        <option value="DU">Dias Úteis</option>
                                    </select>
                                </InputGroup>
                             </div>
                        </div>

                         <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                            <InputGroup label="Forma de Pagamento">
                                <select 
                                    className="w-full p-2 border rounded"
                                    value={config.paymentMethod}
                                    onChange={e => setConfig({...config, paymentMethod: e.target.value as PaymentMethod})}
                                >
                                    <option value={PaymentMethod.PIX}>PIX (À Vista - 10% Desc.)</option>
                                    <option value={PaymentMethod.BOLETO}>Boleto Bancário</option>
                                    <option value={PaymentMethod.CREDIT_CARD}>Cartão de Crédito</option>
                                </select>
                            </InputGroup>

                            {config.paymentMethod === PaymentMethod.BOLETO && (
                                <div className="mt-3 grid grid-cols-3 gap-2">
                                    {['28ddl', '30/60/90ddl'].map(opt => (
                                        <button 
                                            key={opt}
                                            onClick={() => setConfig({...config, boletoCondition: opt as any})}
                                            className={`p-2 rounded border text-sm ${config.boletoCondition === opt ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
                                        >
                                            {opt.toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                            )}

                             {config.paymentMethod === PaymentMethod.PIX && (
                                <div className="mt-2 text-sm text-green-700 font-medium">
                                    Valor com desconto no corpo da proposta: {formatCurrency(getDiscountedTotal())}
                                </div>
                            )}
                         </div>
                    </div>
                </div>
            </section>
          </div>
        )}

        {/* PREVIEW MODE (A4 Visual) */}
        {activeTab === 'preview' && (
           <div className="flex flex-col items-center">
                <div className="w-full max-w-[210mm] mb-4 flex justify-between no-print">
                     <h2 className="text-lg font-semibold text-gray-600">Pré-visualização de Impressão (A4)</h2>
                     <div className="flex gap-2">
                        <button onClick={sendWhatsapp} className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 flex items-center gap-2">
                            <Share2 size={16} /> Enviar WhatsApp
                        </button>
                         <button onClick={generatePDF} className="bg-red-600 text-white px-4 py-2 rounded shadow hover:bg-red-700 flex items-center gap-2">
                            <FileText size={16} /> Gerar PDF
                        </button>
                        <button onClick={() => window.print()} className="bg-gray-800 text-white px-4 py-2 rounded shadow hover:bg-gray-900 flex items-center gap-2">
                            <Printer size={16} /> Imprimir
                        </button>
                     </div>
                </div>

                <div id="print-area" className="a4-page relative text-sm leading-relaxed text-gray-800">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-8 border-b-2 border-primary pb-4">
                        <div className="w-1/3">
                             {company.logoUrl && <img src={company.logoUrl} className="max-h-24 max-w-full object-contain" alt="Logo" />}
                        </div>
                        <div className="w-1/3 text-center pt-2">
                            <h1 className="text-2xl font-bold text-gray-800">COTAÇÃO</h1>
                            <p className="text-lg text-gray-500">#{config.number}</p>
                        </div>
                        <div className="w-1/3 text-right text-xs text-gray-600 space-y-1">
                            <p className="font-bold text-sm text-gray-900">{company.name}</p>
                            <p>{company.cnpj}</p>
                            <p>{company.email}</p>
                            <div className="flex justify-end gap-2 mt-2">
                                {company.phone && <div className="flex items-center gap-1"><Phone size={12}/> {company.phone}</div>}
                                {company.whatsapp && <div className="flex items-center gap-1 text-green-600"><MessageCircle size={12}/> {company.whatsapp}</div>}
                            </div>
                        </div>
                    </div>

                    {/* Client Info */}
                    <div className="mb-6 bg-gray-50 p-4 rounded border border-gray-100">
                        <h3 className="font-bold text-primary mb-2 border-b border-gray-200 pb-1">DADOS DO CLIENTE</h3>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                            <p><span className="font-semibold">Razão Social:</span> {client.name}</p>
                            <p><span className="font-semibold">CNPJ/CPF:</span> {client.doc}</p>
                            <p><span className="font-semibold">Email:</span> {client.email}</p>
                            
                            {!client.hideContacts && (
                                <>
                                    <p><span className="font-semibold">Telefone:</span> {client.phone}</p>
                                    <p><span className="font-semibold">Celular:</span> {client.cell}</p>
                                    <p><span className="font-semibold">WhatsApp:</span> {client.whatsapp}</p>
                                </>
                            )}
                            <p className="col-span-2"><span className="font-semibold">Endereço:</span> {client.address.street}, {client.address.number} - {client.address.neighborhood}, {client.address.city}/{client.address.state}</p>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="mb-6">
                         <h3 className="font-bold text-primary mb-2">ITENS E PRODUTOS</h3>
                         <table className="w-full text-xs text-left border-collapse">
                             <thead>
                                 <tr className="bg-primary text-white">
                                     <th className="p-2 rounded-tl">ITEM</th>
                                     <th className="p-2">NCM</th>
                                     <th className="p-2">EMBALAGEM</th>
                                     <th className="p-2 text-center">QTD</th>
                                     <th className="p-2 text-right">VL. UNIT</th>
                                     <th className="p-2 text-right rounded-tr">TOTAL</th>
                                 </tr>
                             </thead>
                             <tbody>
                                 {items.map((item, idx) => (
                                     <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                                         <td className="p-2 font-medium">{item.name}</td>
                                         <td className="p-2">{item.ncm}</td>
                                         <td className="p-2 font-mono">{item.packaging}</td>
                                         <td className="p-2 text-center">{item.quantity}</td>
                                         <td className="p-2 text-right">{formatCurrency(item.unitPrice)}</td>
                                         <td className="p-2 text-right font-bold">{formatCurrency(item.totalPrice)}</td>
                                     </tr>
                                 ))}
                             </tbody>
                             <tfoot>
                                 <tr className="bg-gray-100 font-bold">
                                     <td colSpan={5} className="p-2 text-right">TOTAL ITENS:</td>
                                     <td className="p-2 text-right">{formatCurrency(getTotalValue())}</td>
                                 </tr>
                                  {config.calculatedFreight > 0 && (
                                     <tr className="bg-gray-100 font-bold text-gray-600">
                                        <td colSpan={5} className="p-2 text-right">FRETE ({config.freightType}):</td>
                                        <td className="p-2 text-right">{formatCurrency(config.calculatedFreight)}</td>
                                     </tr>
                                  )}
                                  <tr className="bg-primary text-white font-bold text-lg">
                                     <td colSpan={5} className="p-2 text-right">VALOR TOTAL:</td>
                                     <td className="p-2 text-right">{formatCurrency(getTotalValue() + config.calculatedFreight)}</td>
                                 </tr>
                             </tfoot>
                         </table>
                    </div>

                    {/* Terms & Conditions */}
                    <div className="grid grid-cols-2 gap-6 mb-12">
                        <div className="text-xs space-y-2">
                             <h4 className="font-bold border-b pb-1">CONDIÇÕES COMERCIAIS</h4>
                             <p><span className="font-semibold">Frete:</span> {config.freightType}</p>
                             <p><span className="font-semibold">Prazo de Entrega:</span> {config.deliveryDays} {config.deliveryType === 'DC' ? 'Dias Corridos' : 'Dias Úteis'}</p>
                             <p><span className="font-semibold">Validade da Proposta:</span> {config.deliveryDays} dias</p>
                        </div>
                        <div className="text-xs space-y-2">
                             <h4 className="font-bold border-b pb-1">FORMA DE PAGAMENTO</h4>
                             <p className="font-semibold uppercase">{config.paymentMethod.replace('_', ' ')}</p>
                             {config.paymentMethod === PaymentMethod.BOLETO && <p>Condição: {config.boletoCondition.toUpperCase()}</p>}
                             {config.paymentMethod === PaymentMethod.PIX && (
                                 <p className="bg-green-50 text-green-800 p-2 rounded border border-green-200 mt-1 font-bold">
                                     Valor para pagamento PIX Antecipado: {formatCurrency(getDiscountedTotal())}
                                 </p>
                             )}
                        </div>
                    </div>

                    {/* Signatures */}
                    <div className="mt-auto grid grid-cols-2 gap-12 pt-12">
                        <div className="text-center">
                            <div className="h-16 flex items-end justify-center mb-2">
                                {company.signatureUrl ? (
                                    <img src={company.signatureUrl} className="max-h-full" alt="Assinatura Empresa" />
                                ) : (
                                    <div className="text-gray-300 italic">Assinatura Digital</div>
                                )}
                            </div>
                            <div className="border-t border-gray-400 pt-2 text-xs uppercase font-bold">
                                {company.name}
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="h-16 mb-2"></div>
                            <div className="border-t border-gray-400 pt-2 text-xs uppercase font-bold">
                                {client.name || 'CLIENTE'}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="absolute bottom-4 left-0 w-full text-center text-[10px] text-gray-400">
                        Gerado via SmartQuote - Documento conferido digitalmente.
                    </div>
                </div>
           </div>
        )}
      </main>
    </div>
  );
}

export default App;