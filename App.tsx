
import React, { useState, useEffect } from 'react';
import { ViewState, Inspection, User, Role, Indication, ServiceItem, MonthlyClosure, SystemLog, PaymentMethod } from './types';
import { Layout } from './components/Layout';
import { Login } from './views/Login';
import { ForgotPassword } from './views/ForgotPassword';
import { Home } from './views/Home';
import { InspectionList } from './views/InspectionList';
import { InspectionForm } from './views/InspectionForm';
import { Management } from './views/Management';
import { Reports } from './views/Reports';

const INITIAL_USERS: User[] = [
    { id: '1', name: 'Admin Principal', email: 'admin@prevencar.com.br', role: 'admin' },
    { id: '2', name: 'Cris Vistoriador', email: 'cris@prevencar.com.br', role: 'vistoriador' },
    { id: '3', name: 'Pedro Vistoriador', email: 'pedro@prevencar.com.br', role: 'vistoriador' },
    { id: '4', name: 'Joana Financeiro', email: 'financeiro@prevencar.com.br', role: 'financeiro' }
];

const INITIAL_INDICATIONS: Indication[] = [
    { id: '1', name: 'Peças AutoSul', document: '12.345.678/0001-90', phone: '(11) 98888-7777', email: 'contato@autosul.com', cep: '01001-000', address: 'Rua Principal', number: '100', neighborhood: 'Centro' },
    { id: '2', name: 'Mecânica Rápida', document: '98.765.432/0001-10', phone: '(11) 97777-6666', email: 'contato@mecanica.com', cep: '02002-000', address: 'Av Secundaria', number: '200', neighborhood: 'Jardins' }
];

const INITIAL_SERVICES: ServiceItem[] = [
    { id: '1', name: 'Laudo de Transferência', price: 100.00, description: 'Laudo obrigatório para transferência.', allowManualClientEdit: true },
    { id: '2', name: 'Laudo Cautelar', price: 250.00, description: 'Análise completa da estrutura.', allowManualClientEdit: true },
    { id: '3', name: 'Laudo de Revistoria', price: 80.00, description: 'Reavaliação de itens apontados em laudo anterior.', allowManualClientEdit: true },
    { id: '4', name: 'Vistoria Prévia', price: 150.00, description: 'Para seguradoras.', allowManualClientEdit: false },
    { id: '5', name: 'Pesquisa', price: 50.00, description: 'Pesquisa de débitos e restrições.', allowManualClientEdit: false },
    { id: '6', name: 'Prevenscan', price: 300.00, description: 'Scanner completo.', allowManualClientEdit: false }
];

const TODAY = new Date().toISOString().split('T')[0];
const CURRENT_MONTH = TODAY.substring(0, 7);

const DEMO_INSPECTIONS: Inspection[] = [
    {
        id: 'INS-001',
        date: TODAY,
        vehicleModel: 'Honda Civic',
        licensePlate: 'ABC-1234',
        selectedServices: ['Laudo de Transferência', 'Pesquisa'],
        client: { name: 'João da Silva', cpf: '123.456.789-00', phone: '(11) 99999-8888', address: 'Rua das Flores', cep: '01001-000', number: '50' },
        inspector: 'Cris Vistoriador',
        totalValue: 150.00,
        paymentMethod: PaymentMethod.PIX,
        status_ficha: 'Completa',
        status_pagamento: 'Pago',
        status: 'Concluída',
        mes_referencia: CURRENT_MONTH,
        nfe: '4567'
    },
    {
        id: 'INS-002',
        date: TODAY,
        vehicleModel: 'Toyota Corolla',
        licensePlate: 'XYZ-5678',
        selectedServices: ['Laudo Cautelar'],
        indicationId: '1',
        indicationName: 'Peças AutoSul',
        client: { name: 'Peças AutoSul', cpf: '12.345.678/0001-90', phone: '(11) 98888-7777', address: 'Rua Principal', cep: '01001-000', number: '100' },
        inspector: 'Pedro Vistoriador',
        totalValue: 250.00,
        status_ficha: 'Completa',
        status_pagamento: 'A pagar',
        status: 'No Caixa',
        mes_referencia: CURRENT_MONTH
    },
    {
        id: 'INS-003',
        date: TODAY,
        vehicleModel: 'Chevrolet Onix',
        licensePlate: 'KJH-9090',
        selectedServices: ['Laudo de Transferência'],
        client: { name: 'Maria Souza', cpf: '987.654.321-11', phone: '(11) 97777-6666', address: 'Av Paulista', cep: '01310-000', number: '1000' },
        inspector: 'Cris Vistoriador',
        totalValue: 100.00,
        paymentMethod: PaymentMethod.DEBITO,
        status_ficha: 'Completa',
        status_pagamento: 'Pago',
        status: 'Concluída',
        mes_referencia: CURRENT_MONTH,
        nfe: '8812'
    }
];

function useLocalStorage<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
}

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.LOGIN);
  const [currentUser, setCurrentUser] = useState<User | undefined>(undefined);
  
  const [inspections, setInspections] = useLocalStorage<Inspection[]>('prevencar_inspections', DEMO_INSPECTIONS);
  const [users, setUsers] = useLocalStorage<User[]>('prevencar_users', INITIAL_USERS);
  const [indications, setIndications] = useLocalStorage<Indication[]>('prevencar_indications', INITIAL_INDICATIONS);
  const [services, setServices] = useLocalStorage<ServiceItem[]>('prevencar_services', INITIAL_SERVICES);
  const [monthlyClosures, setMonthlyClosures] = useLocalStorage<MonthlyClosure[]>('prevencar_closures', []);
  const [logs, setLogs] = useLocalStorage<SystemLog[]>('prevencar_logs', []);

  const [editingInspection, setEditingInspection] = useState<Inspection | null>(null);
  const [initialFormStep, setInitialFormStep] = useState<number>(1);
  const [isViewOnly, setIsViewOnly] = useState<boolean>(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('prevencar_remembered_user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
      setCurrentView(ViewState.HOME);
    }
  }, []);

  const addLog = (type: SystemLog['type'], description: string, details?: string) => {
      const newLog: SystemLog = {
          id: Math.random().toString(36).substr(2, 9),
          timestamp: new Date().toISOString(),
          userId: currentUser?.id || 'anonymous',
          userName: currentUser?.name || 'Sistema',
          type,
          description,
          details
      };
      setLogs(prev => [newLog, ...prev.slice(0, 999)]);
  };

  const isMonthClosed = (mes?: string) => {
    if (!mes) return false;
    return monthlyClosures.some(c => c.mes === mes && c.fechado);
  };

  const handleLogin = (email: string, rememberMe: boolean) => {
    const existingUser = users.find(u => u.email === email);
    if (!existingUser) {
        alert("Usuário não cadastrado.");
        return;
    }

    setCurrentUser(existingUser);
    addLog('operacional', `Usuário ${existingUser.name} realizou login.`);
    if (rememberMe) {
      localStorage.setItem('prevencar_remembered_user', JSON.stringify(existingUser));
    }
    setCurrentView(ViewState.HOME);
  };

  const handleLogout = () => {
    addLog('operacional', `Usuário ${currentUser?.name} realizou logout.`);
    setCurrentUser(undefined);
    localStorage.removeItem('prevencar_remembered_user');
    setCurrentView(ViewState.LOGIN);
  };

  const handleStartNewInspection = () => {
    setEditingInspection(null);
    setInitialFormStep(1);
    setIsViewOnly(false);
    setCurrentView(ViewState.INSPECTION_FORM);
  };

  const handleEditInspection = (inspection: Inspection, step: number = 1) => {
    setEditingInspection(inspection);
    setInitialFormStep(step);
    setIsViewOnly(false);
    setCurrentView(ViewState.INSPECTION_FORM);
  };

  const handleViewInspection = (inspection: Inspection) => {
    setEditingInspection(inspection);
    setInitialFormStep(1);
    setIsViewOnly(true);
    setCurrentView(ViewState.INSPECTION_FORM);
  };

  const handleSaveInspection = (newInspection: Inspection) => {
    if (isMonthClosed(newInspection.mes_referencia)) {
        addLog('seguranca', `Tentativa de salvar ficha em mês fechado (${newInspection.mes_referencia})`, `ID Ficha: ${newInspection.id}`);
        alert("Erro de Segurança: O período está fechado.");
        return;
    }

    if (newInspection.status_pagamento === 'Pago' && newInspection.status_ficha === 'Incompleta') {
        addLog('seguranca', `Tentativa de registrar pagamento em ficha incompleta`, `Placa: ${newInspection.licensePlate}`);
        alert("Erro de Segurança: Ficha incompleta não permite faturamento.");
        return;
    }

    if (editingInspection) {
      setInspections(prev => prev.map(i => i.id === newInspection.id ? newInspection : i));
    } else {
      setInspections(prev => [newInspection, ...prev]);
    }
    setIsViewOnly(false);
    setCurrentView(ViewState.INSPECTION_LIST);
  };

  const handleBulkUpdateInspections = (data: { ids: string[], updates: Partial<Inspection> }) => {
    const now = new Date().toISOString().split('T')[0];
    const targetInspections = inspections.filter(i => data.ids.includes(i.id));
    
    const hasClosedMonth = targetInspections.some(i => isMonthClosed(i.mes_referencia));
    if (hasClosedMonth) {
        alert("Acesso negado: Período encerrado.");
        return;
    }

    setInspections(prev => prev.map(i => {
        if (data.ids.includes(i.id)) {
            const updated = { ...i, ...data.updates };
            // Se o status geral for Concluída, marcar como pago
            if (data.updates.status === 'Concluída') {
                updated.status_pagamento = 'Pago';
                updated.data_pagamento = now;
            }
            // Se estiver atualizando a forma de pagamento em lote para algo que não seja "A Pagar"
            if (data.updates.paymentMethod && data.updates.paymentMethod !== PaymentMethod.A_PAGAR) {
                updated.status_pagamento = 'Pago';
                updated.data_pagamento = now;
            }
            return updated;
        }
        return i;
    }));
    
    addLog('financeiro', `Atualização em lote realizada para ${data.ids.length} fichas.`, `Fichas: ${data.ids.join(', ')}`);
  };

  const processMonthlyClosure = (mes: string) => {
      if (currentUser?.role !== 'admin' && currentUser?.role !== 'financeiro') {
          alert("Acesso Negado.");
          return;
      }

      const monthInspections = inspections.filter(i => i.mes_referencia === mes);
      const totalValor = monthInspections.reduce((acc, curr) => acc + (curr.totalValue || 0), 0);

      const newClosure: MonthlyClosure = {
          id: Math.random().toString(36).substr(2, 9),
          mes: mes,
          fechado: true,
          data_fechamento: new Date().toISOString().split('T')[0],
          usuario_fechou: currentUser.name,
          total_valor: totalValor
      };

      setMonthlyClosures([...monthlyClosures, newClosure]);
      return { success: true, message: `Mês ${mes} fechado.` };
  };

  const handleSaveUser = (user: User) => {
      if (users.find(u => u.id === user.id)) setUsers(users.map(u => u.id === user.id ? user : u));
      else setUsers([...users, { ...user, id: Math.random().toString(36).substr(2, 9) }]);
  };

  const onDeleteUser = (id: string) => {
      setUsers(prev => prev.filter(u => u.id !== id));
  };

  const handleSaveIndication = (ind: Indication) => {
      setIndications(prev => {
          const exists = prev.find(x => x.id === ind.id);
          if (exists) return prev.map(x => x.id === ind.id ? ind : x);
          return [...prev, ind];
      });
  };

  const handleSaveService = (service: ServiceItem) => {
      setServices(prev => {
          const exists = prev.find(x => x.id === service.id);
          if (exists) return prev.map(x => x.id === service.id ? service : x);
          return [...prev, service];
      });
  };

  const onDeleteService = (id: string) => {
      setServices(prev => prev.filter(x => x.id !== id));
  };

  const renderView = () => {
    switch (currentView) {
      case ViewState.LOGIN:
        return <Login onLogin={handleLogin} changeView={setCurrentView} />;
      case ViewState.FORGOT_PASSWORD:
        return <ForgotPassword changeView={setCurrentView} users={users} onResetPassword={(e, n) => {
            setUsers(prev => prev.map(u => u.email === e ? { ...u, password: n } : u));
        }} />;
      case ViewState.HOME:
        return (
          <Layout currentView={currentView} changeView={setCurrentView} logout={handleLogout} currentUser={currentUser}>
            <Home changeView={setCurrentView} startNewInspection={handleStartNewInspection} currentUser={currentUser} inspections={inspections} />
          </Layout>
        );
      case ViewState.INSPECTION_LIST:
        return (
          <Layout currentView={currentView} changeView={setCurrentView} logout={handleLogout} currentUser={currentUser}>
            <InspectionList 
              inspections={inspections} 
              onEdit={handleEditInspection} 
              onView={handleViewInspection}
              onDelete={id => {
                  const ins = inspections.find(x => x.id === id);
                  if (isMonthClosed(ins?.mes_referencia)) return;
                  setInspections(prev => prev.filter(i => i.id !== id));
              }} 
              onBulkUpdate={handleBulkUpdateInspections} 
              changeView={setCurrentView} 
              onCreate={handleStartNewInspection} 
              currentUser={currentUser}
              indications={indications}
              services={services}
              closures={monthlyClosures}
            />
          </Layout>
        );
      case ViewState.INSPECTION_FORM:
        return (
          <Layout currentView={currentView} changeView={setCurrentView} logout={handleLogout} currentUser={currentUser}>
            <InspectionForm 
                inspectionToEdit={editingInspection} 
                onSave={handleSaveInspection} 
                onCancel={() => {
                    setIsViewOnly(false);
                    setCurrentView(ViewState.INSPECTION_LIST);
                }} 
                onDelete={id => {
                    const ins = inspections.find(x => x.id === id);
                    if (isMonthClosed(ins?.mes_referencia)) return;
                    setInspections(prev => prev.filter(i => i.id !== id));
                }} 
                currentUser={currentUser} 
                indications={indications} 
                services={services} 
                closures={monthlyClosures} 
                initialStep={initialFormStep}
                readOnly={isViewOnly}
            />
          </Layout>
        );
      case ViewState.REPORTS:
        return (
          <Layout currentView={currentView} changeView={setCurrentView} logout={handleLogout} currentUser={currentUser}>
            <Reports inspections={inspections} indications={indications} currentUser={currentUser} />
          </Layout>
        );
      case ViewState.MANAGEMENT:
        return (
          <Layout currentView={currentView} changeView={setCurrentView} logout={handleLogout} currentUser={currentUser}>
            <Management 
                currentUser={currentUser} 
                users={users} 
                indications={indications} 
                services={services} 
                closures={monthlyClosures} 
                inspections={inspections}
                logs={logs}
                onSaveUser={handleSaveUser} 
                onDeleteUser={onDeleteUser} 
                onSaveIndication={handleSaveIndication} 
                onDeleteIndication={id => setIndications(prev => prev.filter(i => i.id !== id))} 
                onSaveService={handleSaveService} 
                onDeleteService={onDeleteService} 
                onProcessClosure={processMonthlyClosure} 
            />
          </Layout>
        );
      default:
        return <Login onLogin={handleLogin} changeView={setCurrentView} />;
    }
  };

  return <>{renderView()}</>;
};

export default App;
