import { useStore } from '@/store/useStore';

const EmailPageSimple = () => {
  const { user } = useStore();

  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>Email Integration</h1>
      
      <div style={{ background: '#f0f0f0', padding: '20px', borderRadius: '8px' }}>
        <h2>Debug Info</h2>
        <pre style={{ background: 'white', padding: '10px', overflow: 'auto' }}>
          {JSON.stringify({
            hasUser: !!user,
            email: user?.email,
            name: user?.name,
            email_connected: user?.email_connected,
          }, null, 2)}
        </pre>
      </div>

      {!user?.email_connected ? (
        <div style={{ marginTop: '20px', padding: '20px', background: '#e3f2fd', borderRadius: '8px' }}>
          <h3>Mailbox not connected</h3>
          <p>Sign in with Microsoft to enable mailbox features.</p>
        </div>
      ) : (
        <div style={{ marginTop: '20px', padding: '20px', background: '#e8f5e9', borderRadius: '8px' }}>
          <h3>Mailbox connected</h3>
          <p>Email capabilities are under construction...</p>
        </div>
      )}
    </div>
  );
};

export default EmailPageSimple;

