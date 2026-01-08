
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
import { subscribeToCollection, saveDoc, deleteDocById } from './services/firestoreService';

const INITIAL_USERS: User[] = [
  { id: 'admin', name: 'Admin Principal', email: 'admin@prevencar.com.br', role: 'admin' }
];

const INITIAL_INDICATIONS: Indication[] = [];

const INITIAL_SERVICES: ServiceItem[] = [];

const TODAY = new Date().toISOString().split('T')[0];
const CURRENT_MONTH = TODAY.substring(0, 7);

const DEMO_INSPECTIONS: Inspection[] = [];

// Firestore is used as the source of truth. Local state mirrors collections via real-time listeners.

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.LOGIN);
  const [currentUser, setCurrentUser] = useState<User | undefined>(undefined);
  
  const [inspections, setInspections] = useState<Inspection[]>(DEMO_INSPECTIONS);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [indications, setIndications] = useState<Indication[]>(INITIAL_INDICATIONS);
  const [services, setServices] = useState<ServiceItem[]>(INITIAL_SERVICES);
  const [monthlyClosures, setMonthlyClosures] = useState<MonthlyClosure[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);

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

  useEffect(() => {
    const unsubIns = subscribeToCollection<Inspection>('inspections', items => setInspections(items.length ? items : DEMO_INSPECTIONS));
    const unsubUsers = subscribeToCollection<User>('users', items => setUsers(items.length ? items : INITIAL_USERS));
    const unsubInd = subscribeToCollection<Indication>('indications', setIndications);
    const unsubServices = subscribeToCollection<ServiceItem>('services', items => items.length ? setServices(items) : setServices(INITIAL_SERVICES));
    const unsubClosures = subscribeToCollection<MonthlyClosure>('monthlyClosures', setMonthlyClosures);
    const unsubLogs = subscribeToCollection<SystemLog>('logs', setLogs);

    return () => {
      try { unsubIns(); } catch (e) {}
      try { unsubUsers(); } catch (e) {}
      try { unsubInd(); } catch (e) {}
      try { unsubServices(); } catch (e) {}
      try { unsubClosures(); } catch (e) {}
      try { unsubLogs(); } catch (e) {}
    };
  }, []);

  const addLog = async (type: SystemLog['type'], description: string, details?: string) => {
      const newLog: SystemLog = {
          id: Math.random().toString(36).substr(2, 9),
          timestamp: new Date().toISOString(),
          userId: currentUser?.id || 'anonymous',
          userName: currentUser?.name || 'Sistema',
          type,
          description,
          details
      };
      try {
        await saveDoc('logs', newLog);
      } catch (e) {
        console.error('Falha ao salvar log', e);
      }
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

    (async () => {
      try {
        await saveDoc('inspections', newInspection);
      } catch (e) {
        console.error('Erro ao salvar inspeção:', e);
        alert('Erro ao salvar inspeção. Veja o console.');
      }
    })();
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
    (async () => {
      try {
        const updates = data.ids.map(id => {
          const existing = inspections.find(i => i.id === id);
          if (!existing) return null;
          const updated: Inspection = { ...existing, ...data.updates } as Inspection;
          if (data.updates.status === 'Concluída') {
            updated.status_pagamento = 'Pago';
            updated.data_pagamento = now;
          }
          if (data.updates.paymentMethod && data.updates.paymentMethod !== PaymentMethod.A_PAGAR) {
            updated.status_pagamento = 'Pago';
            updated.data_pagamento = now;
          }
          return saveDoc('inspections', updated);
        }).filter(Boolean);
        await Promise.all(updates as Promise<any>[]);
        addLog('financeiro', `Atualização em lote realizada para ${data.ids.length} fichas.`, `Fichas: ${data.ids.join(', ')}`);
      } catch (e) {
        console.error('Erro em atualização em lote:', e);
      }
    })();
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

      (async () => {
        try {
          await saveDoc('monthlyClosures', newClosure);
        } catch (e) {
          console.error('Erro ao salvar fechamento:', e);
        }
      })();
      return { success: true, message: `Mês ${mes} fechado.` };
  };

  const handleSaveUser = (user: User) => {
      (async () => {
        try {
          if (!user.id) user.id = Math.random().toString(36).substr(2, 9);
          await saveDoc('users', user);
        } catch (e) {
          console.error('Erro ao salvar usuário:', e);
        }
      })();
  };

  const onDeleteUser = (id: string) => {
      (async () => {
        try {
          await deleteDocById('users', id);
        } catch (e) { console.error(e); }
      })();
  };

  const handleSaveIndication = (ind: Indication) => {
      (async () => {
        try {
          if (!ind.id) ind.id = Math.random().toString(36).substr(2, 9);
          await saveDoc('indications', ind);
        } catch (e) { console.error(e); }
      })();
  };

  const handleSaveService = (service: ServiceItem) => {
      (async () => {
        try {
          if (!service.id) service.id = Math.random().toString(36).substr(2, 9);
          await saveDoc('services', service);
        } catch (e) { console.error(e); }
      })();
  };

  const onDeleteService = (id: string) => {
      (async () => {
        try { await deleteDocById('services', id); } catch (e) { console.error(e); }
      })();
  };

  const renderView = () => {
    switch (currentView) {
      case ViewState.LOGIN:
        return <Login onLogin={handleLogin} changeView={setCurrentView} />;
      case ViewState.FORGOT_PASSWORD:
        return <ForgotPassword changeView={setCurrentView} />;
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
                  (async () => { try { await deleteDocById('inspections', id); } catch (e) { console.error(e); } })();
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
                  (async () => { try { await deleteDocById('inspections', id); } catch (e) { console.error(e); } })();
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
                onDeleteIndication={id => { (async () => { try { await deleteDocById('indications', id); } catch (e) { console.error(e); } })(); }} 
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
