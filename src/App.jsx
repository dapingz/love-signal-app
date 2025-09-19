import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  onAuthStateChanged, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  setDoc, 
  getDoc,
  getDocs,
  Timestamp,
  writeBatch
} from 'firebase/firestore';

// --- Firebase 配置 ---
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- 图标组件 ---
const Icon = ({ name, className }) => {
  const icons = {
    send: <path d="M22 2 11 13 2 9l-2 9 9-2 9-9-2-9z" />,
    receive: <path d="m11 13-2 9 9-2 9-9-2-9-9 9z" />,
    log: <path d="M12 22h6a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v10" />,
    challenge: <path d="M15.5 22a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-7a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5-.5z" />,
    map: <path d="M21 12V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7.5" />,
    report: <path d="M2.5 2v6h6V2h-6zm15 0v6h6V2h-6zm-15 15v6h6v-6h-6zm15 0v6h6v-6h-6z" />,
    settings: <path d="M12.22 2h-4.44L4 6v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6l-3.78-4z" />,
    plus: <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>,
    x: <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>,
    edit: <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></>,
    trash: <><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></>,
    user: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
    logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></>,
    arrowRight: <polyline points="9 18 15 12 9 6" />,
    atSign: <><circle cx="12" cy="12" r="4"></circle><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"></path></>,
    mail: <><rect x="2" y="4" width="20" height="16" rx="2"></rect><polyline points="22,6 12,13 2,6"></polyline></>,
    lock: <><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></>,
    dashboard: <path d="M12 22h6a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v10" />,
    logs: <><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></>,
    profile: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
  };
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {icons[name]}
    </svg>
  );
};

// --- 主应用组件 (登录后) ---
const MainApp = ({ user, userData }) => {
  const [page, setPage] = useState('dashboard');
  const [logs, setLogs] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [usersCache, setUsersCache] = useState({});

  useEffect(() => {
    if (!user || !userData) return;
    
    setUsersCache(prev => ({ ...prev, [user.uid]: userData }));

    const sentQuery = query(collection(db, 'signals'), where('senderId', '==', user.uid));
    const receivedQuery = query(collection(db, 'signals'), where('recipientId', '==', user.uid));

    const fetchUser = async (uid) => {
      if (usersCache[uid]) return usersCache[uid];
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const fetchedUserData = userSnap.data();
        setUsersCache(prev => ({...prev, [uid]: fetchedUserData}));
        return fetchedUserData;
      }
      return { username: '未知用户' };
    };

    const processLogs = async (snapshot, type) => {
        const newLogs = [];
        for (const docSnapshot of snapshot.docs) {
            const data = docSnapshot.data();
            const log = { id: docSnapshot.id, ...data, timestamp: data.timestamp?.toDate() };
            
            if(type === 'sent') {
                log.direction = 'sent';
                const recipientData = await fetchUser(data.recipientId);
                log.otherPartyUsername = recipientData.username;
            } else {
                log.direction = 'received';
                const senderData = await fetchUser(data.senderId);
                log.otherPartyUsername = senderData.username;
            }
            newLogs.push(log);
        }
        return newLogs;
    };

    const unsubSent = onSnapshot(sentQuery, async (snapshot) => {
        const sentLogs = await processLogs(snapshot, 'sent');
        setLogs(prev => [...sentLogs, ...prev.filter(l => l.direction !== 'sent')].sort((a,b) => b.timestamp - a.timestamp));
    }, (error) => console.error("Sent logs error:", error));

    const unsubReceived = onSnapshot(receivedQuery, async (snapshot) => {
        const receivedLogs = await processLogs(snapshot, 'received');
        setLogs(prev => [...receivedLogs, ...prev.filter(l => l.direction !== 'received')].sort((a,b) => b.timestamp - a.timestamp));
    }, (error) => console.error("Received logs error:", error));

    return () => {
      unsubSent();
      unsubReceived();
    };
  }, [user, userData]);
  
  const sentCount = logs.filter(log => log.direction === 'sent').length;
  const receivedCount = logs.filter(log => log.direction === 'received').length;

  const renderPage = () => {
    switch (page) {
      case 'dashboard':
        return <Dashboard sentCount={sentCount} receivedCount={receivedCount} onSendSignal={() => setIsModalOpen(true)} />;
      case 'logs':
        return <LoveLog logs={logs} />;
      case 'profile':
          return <Profile userData={userData} />;
      default:
        return <Dashboard sentCount={sentCount} receivedCount={receivedCount} onSendSignal={() => setIsModalOpen(true)} />;
    }
  };

  return (
    <div className="bg-rose-50 min-h-screen font-sans text-gray-800 flex flex-col">
      <main className="flex-grow p-4 pb-20">
        {renderPage()}
      </main>
      <SendSignalModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} currentUser={user} />
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-rose-200 flex justify-around p-2 shadow-top">
        {['dashboard', 'logs', 'profile'].map(p => (
          <button key={p} onClick={() => setPage(p)} className={`flex flex-col items-center justify-center w-full rounded-lg p-2 transition-colors duration-200 ${page === p ? 'bg-rose-100 text-rose-600' : 'text-gray-500 hover:bg-rose-50'}`}>
            <Icon name={p} className="w-6 h-6 mb-1" />
            <span className="text-xs capitalize">{p}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

// ... (Dashboard, LoveLog, Profile components remain the same)
const Dashboard = ({ sentCount, receivedCount, onSendSignal }) => {
    const loveIndex = Math.min(100, Math.round(Math.sqrt(sentCount * 10 + receivedCount * 15)));
    return (
        <div className="flex flex-col items-center text-center">
            <h1 className="text-2xl font-bold text-rose-800 mb-2">爱指数</h1>
            <div className="relative w-48 h-48 flex items-center justify-center mb-6">
                <svg className="absolute w-full h-full" viewBox="0 0 36 36">
                    <path className="text-rose-200" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3"></path>
                    <path className="text-rose-500 transition-all duration-1000" strokeDasharray={`${loveIndex}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"></path>
                </svg>
                <span className="text-5xl font-bold text-rose-600">{loveIndex}</span>
            </div>
            <p className="text-gray-600 mb-8">今天，你感受到爱了吗？</p>
            <button onClick={onSendSignal} className="bg-rose-500 hover:bg-rose-600 text-white font-bold py-4 px-8 rounded-full shadow-lg transform hover:scale-105 transition-all duration-200">
                发送一个爱信号
            </button>
            <div className="flex justify-around w-full max-w-sm mt-10">
                <div className="text-center">
                    <p className="text-3xl font-bold text-rose-500">{sentCount}</p>
                    <p className="text-sm text-gray-500">已发送</p>
                </div>
                <div className="text-center">
                    <p className="text-3xl font-bold text-teal-500">{receivedCount}</p>
                    <p className="text-sm text-gray-500">已接收</p>
                </div>
            </div>
        </div>
    );
};

const LoveLog = ({ logs }) => (
    <div>
        <h1 className="text-2xl font-bold text-rose-800 mb-4">爱日志</h1>
        <div className="space-y-4">
            {logs.length > 0 ? logs.map(log => (
                <div key={log.id} className={`p-4 rounded-lg shadow-md flex items-start space-x-4 ${log.direction === 'sent' ? 'bg-rose-100' : 'bg-teal-50'}`}>
                    <div className={`p-2 rounded-full ${log.direction === 'sent' ? 'bg-rose-200 text-rose-600' : 'bg-teal-100 text-teal-600'}`}>
                        <Icon name={log.direction === 'sent' ? 'send' : 'receive'} className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="font-semibold">
                            {log.direction === 'sent' ? `发给 ${log.otherPartyUsername || '...'}` : `来自 ${log.otherPartyUsername || '...'}`}
                            <span className="ml-2 text-xs font-normal text-gray-500">{log.timestamp?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </p>
                        <p className="text-sm text-gray-700 mt-1">{log.message}</p>
                        <p className="text-xs text-rose-400 mt-2 font-medium bg-rose-100 px-2 py-1 rounded-full inline-block">{log.type}</p>
                    </div>
                </div>
            )) : <p className="text-gray-500 text-center mt-8">还没有任何记录。</p>}
        </div>
    </div>
);

const Profile = ({ userData }) => {
    const handleLogout = () => {
        signOut(auth).catch(error => console.error("Logout Error:", error));
    };

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold text-rose-800 mb-6 text-center">个人资料</h1>
            <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-rose-200 flex items-center justify-center mb-4">
                    <Icon name="user" className="w-12 h-12 text-rose-500" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">@{userData?.username}</h2>
                <p className="text-gray-500 mb-6">{userData?.email}</p>
                <button onClick={handleLogout} className="w-full flex items-center justify-center bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 px-4 rounded-lg transition-colors">
                    <Icon name="logout" className="w-5 h-5 mr-2" />
                    <span>退出登录</span>
                </button>
            </div>
        </div>
    );
};


const SendSignalModal = ({ isOpen, onClose, currentUser }) => {
    const [recipientUsername, setRecipientUsername] = useState('');
    const [message, setMessage] = useState('');
    const [type, setType] = useState('赞美');
    const [error, setError] = useState('');
    const [isSending, setIsSending] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!recipientUsername || !message) {
            setError('请填写所有字段。');
            return;
        }
        setError('');
        setIsSending(true);

        try {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where("username", "==", recipientUsername.toLowerCase()));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                setError('未找到该用户。请检查用户名是否正确。');
                setIsSending(false);
                return;
            }

            const recipientData = querySnapshot.docs[0].data();
            const recipientId = recipientData.uid;

            if (recipientId === currentUser.uid) {
                setError('不能给自己发送信号哦。');
                setIsSending(false);
                return;
            }

            await addDoc(collection(db, 'signals'), {
                senderId: currentUser.uid,
                recipientId: recipientId,
                message,
                type,
                timestamp: Timestamp.now(),
            });

            onClose();
            setRecipientUsername('');
            setMessage('');
            setType('赞美');
        } catch (err) {
            console.error("发送信号失败:", err);
            setError('发送失败，请稍后再试。');
        } finally {
            setIsSending(false);
        }
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-xl font-bold text-rose-800 mb-4">发送爱信号</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="recipient">收件人用户名</label>
                        <input id="recipient" type="text" value={recipientUsername} onChange={(e) => setRecipientUsername(e.target.value)} placeholder="@朋友的用户名" className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-rose-300" />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="message">信息</label>
                        <textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="写下你想说的话..." className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-rose-300 h-24"></textarea>
                    </div>
                    <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="type">信号类型</label>
                        <select id="type" value={type} onChange={(e) => setType(e.target.value)} className="shadow border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-rose-300">
                            {['赞美', '倾听', '帮助', '陪伴', '礼物', '肯定', '付出'].map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    {error && <p className="text-red-500 text-xs italic mb-4">{error}</p>}
                    <div className="flex items-center justify-between">
                        <button type="button" onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 px-4 rounded-lg transition-colors">取消</button>
                        <button type="submit" disabled={isSending} className="bg-rose-500 hover:bg-rose-600 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-rose-300">
                            {isSending ? '发送中...' : '发送'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// --- 认证页面组件 (登录前) ---
const AuthPage = () => {
    const [isLoginView, setIsLoginView] = useState(true);

    return (
        <div className="min-h-screen bg-rose-50 flex flex-col justify-center items-center p-4">
             <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-rose-600">爱信号增强器</h1>
                <p className="text-gray-600 mt-2">重新发现生活中的点滴温暖</p>
            </div>
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
                {isLoginView ? <LoginForm /> : <SignupForm />}
                <div className="text-center mt-6">
                    <button onClick={() => setIsLoginView(!isLoginView)} className="text-sm text-rose-500 hover:text-rose-700 font-semibold">
                        {isLoginView ? '还没有账户？点击注册' : '已有账户？点击登录'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const LoginForm = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err) {
            setError('登录失败。请检查您的邮箱和密码。');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">登录</h2>
            <form onSubmit={handleLogin} className="space-y-4">
                <div className="relative">
                    <Icon name="mail" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input type="email" placeholder="邮箱" value={email} onChange={e => setEmail(e.target.value)} required className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-rose-500 focus:border-rose-500"/>
                </div>
                <div className="relative">
                    <Icon name="lock" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input type="password" placeholder="密码" value={password} onChange={e => setPassword(e.target.value)} required className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-rose-500 focus:border-rose-500"/>
                </div>
                {error && <p className="text-red-500 text-xs text-center">{error}</p>}
                <button type="submit" disabled={isLoading} className="w-full bg-rose-500 text-white py-2 rounded-lg font-semibold hover:bg-rose-600 transition-colors disabled:bg-rose-300">
                    {isLoading ? '登录中...' : '登录'}
                </button>
            </form>
        </div>
    );
};

const SignupForm = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSignup = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        if (username.length < 3) {
            setError('用户名至少需要3个字符。');
            setIsLoading(false);
            return;
        }
        
        const finalUsername = username.toLowerCase();

        // Use a more secure and efficient way to check for username uniqueness
        const usernameDocRef = doc(db, "usernames", finalUsername);
        const usernameDoc = await getDoc(usernameDocRef);
        if (usernameDoc.exists()) {
            setError('该用户名已被使用，请换一个。');
            setIsLoading(false);
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            // Use a batch write for atomic operation
            const batch = writeBatch(db);

            const userDocRef = doc(db, 'users', user.uid);
            batch.set(userDocRef, { 
                uid: user.uid, 
                username: finalUsername, 
                email: email 
            });

            const newUsernameDocRef = doc(db, "usernames", finalUsername);
            batch.set(newUsernameDocRef, { uid: user.uid });
            
            await batch.commit();

        } catch (err) {
            if (err.code === 'auth/email-already-in-use') {
                setError('该邮箱已被注册。');
            } else if (err.code === 'auth/weak-password') {
                setError('密码太弱，至少需要6个字符。');
            } else {
                setError('注册失败，请稍后再试。');
            }
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div>
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">注册新账户</h2>
            <form onSubmit={handleSignup} className="space-y-4">
                 <div className="relative">
                    <Icon name="atSign" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input type="text" placeholder="用户名 (独一无二)" value={username} onChange={e => setUsername(e.target.value)} required className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-rose-500 focus:border-rose-500"/>
                </div>
                <div className="relative">
                    <Icon name="mail" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input type="email" placeholder="邮箱" value={email} onChange={e => setEmail(e.target.value)} required className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-rose-500 focus:border-rose-500"/>
                </div>
                <div className="relative">
                    <Icon name="lock" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input type="password" placeholder="密码 (至少6位)" value={password} onChange={e => setPassword(e.target.value)} required className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-rose-500 focus:border-rose-500"/>
                </div>
                {error && <p className="text-red-500 text-xs text-center">{error}</p>}
                <button type="submit" disabled={isLoading} className="w-full bg-rose-500 text-white py-2 rounded-lg font-semibold hover:bg-rose-600 transition-colors disabled:bg-rose-300">
                    {isLoading ? '创建中...' : '创建账户'}
                </button>
            </form>
        </div>
    );
};

// --- 应用根组件 ---
function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const unsubDoc = onSnapshot(userDocRef, (docSnap) => {
             if (docSnap.exists()) {
                setUserData(docSnap.data());
             } else {
                console.log("User document doesn't exist yet.");
             }
             setUser(currentUser);
             setIsLoading(false);
        }, (error) => {
            console.error("Error fetching user data:", error);
            setIsLoading(false); // Stop loading even if there's an error
        });
        return () => unsubDoc();
      } else {
        setUser(null);
        setUserData(null);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);
  
  if (isLoading) {
    return (
        <div className="min-h-screen bg-rose-50 flex justify-center items-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-rose-500"></div>
        </div>
    );
  }

  return user && userData ? <MainApp user={user} userData={userData} /> : <AuthPage />;
}

export default App;

