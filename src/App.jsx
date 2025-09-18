import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, where, onSnapshot, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// --- Firebase Configuration ---
// IMPORTANT: These values will be replaced by Vercel's environment variables during deployment.
// For local testing, you will create a .env.local file.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Icon Component ---
const Icon = ({ name, className }) => {
    const icons = {
        home: <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />,
        book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></>,
        zap: <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />,
        map: <><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" /><line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" /></>,
        barChart: <><line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" /></>,
        settings: <><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l-.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2l.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></>,
        send: <><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></>,
        receive: <><path d="M15 3h6v6" /><path d="M10 14 21 3" /><path d="M21 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6" /></>,
        plus: <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>,
        x: <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>,
        edit: <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></>,
        trash: <><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></>,
        user: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
        gift: <><rect x="3" y="8" width="18" height="4" rx="1" /><path d="M12 8v13" /><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" /><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5" /></>,
        message: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
        heart: <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />,
        copy: <><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></>,
    };
    return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>{icons[name]}</svg>;
};


// --- Main App Component ---
export default function App() {
  const [userId, setUserId] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [logs, setLogs] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentLog, setCurrentLog] = useState(null);

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        signInAnonymously(auth).catch((error) => console.error("Anonymous sign-in failed:", error));
      }
    });
  }, []);

  useEffect(() => {
    if (!userId) return;
    const appId = 'love-signal-app'; // Your unique app identifier

    const signalsCollection = collection(db, "artifacts", appId, "public", "data", "signals");

    // Queries for signals sent by the user OR received by the user
    const sentQuery = query(signalsCollection, where("senderId", "==", userId));
    const receivedQuery = query(signalsCollection, where("recipientId", "==", userId));

    const unsubscribeSent = onSnapshot(sentQuery, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            updateLogsFromSnapshot(change);
        });
    });
    
    const unsubscribeReceived = onSnapshot(receivedQuery, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            updateLogsFromSnapshot(change);
        });
    });

    // Helper to avoid duplicate logs in state
    const updateLogsFromSnapshot = (change) => {
        const logData = { id: change.doc.id, ...change.doc.data() };
        setLogs(prevLogs => {
            const existingLogIndex = prevLogs.findIndex(log => log.id === logData.id);
            if (change.type === "added") {
                if (existingLogIndex === -1) {
                    return [...prevLogs, logData].sort((a, b) => b.timestamp?.toMillis() - a.timestamp?.toMillis());
                }
                return prevLogs; // Already exists
            }
            if (change.type === "modified") {
                if (existingLogIndex !== -1) {
                    const newLogs = [...prevLogs];
                    newLogs[existingLogIndex] = logData;
                    return newLogs.sort((a, b) => b.timestamp?.toMillis() - a.timestamp?.toMillis());
                }
            }
            if (change.type === "removed") {
                return prevLogs.filter(log => log.id !== logData.id);
            }
            return prevLogs;
        });
    };

    return () => {
        unsubscribeSent();
        unsubscribeReceived();
    };
  }, [userId]);
  

  const openModal = (log = null) => {
    setCurrentLog(log);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setCurrentLog(null);
  };

  const getLoveIndex = () => {
    if (logs.length === 0) return 50;
    const sent = logs.filter(log => log.senderId === userId).length;
    const received = logs.filter(log => log.recipientId === userId).length;
    const ratio = received > 0 ? sent / received : sent;
    const index = Math.min(100, 50 + sent * 5 - received * 2 + ratio * 5);
    return Math.round(index);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home': return <Dashboard logs={logs} userId={userId} openModal={openModal} loveIndex={getLoveIndex()} />;
      case 'logs': return <LoveLog logs={logs} userId={userId} openModal={openModal} />;
      case 'challenges': return <Challenges />;
      case 'map': return <RelationshipMap />;
      case 'reports': return <Reports logs={logs} userId={userId} />;
      case 'settings': return <Settings userId={userId} />;
      default: return <Dashboard logs={logs} userId={userId} openModal={openModal} loveIndex={getLoveIndex()} />;
    }
  };

  return (
    <div className="bg-pink-50 min-h-screen font-sans flex flex-col">
      <main className="flex-grow p-4 pb-20">
        {renderContent()}
      </main>
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      {showModal && <LogModal closeModal={closeModal} currentLog={currentLog} userId={userId} />}
    </div>
  );
}

// --- Child Components ---

const Dashboard = ({ logs, userId, openModal, loveIndex }) => {
    const sentCount = logs.filter(log => log.senderId === userId).length;
    const receivedCount = logs.filter(log => log.recipientId === userId).length;

    return (
        <div className="text-center">
            <h1 className="text-2xl font-bold text-pink-600 mb-2">爱信号增强器</h1>
            <p className="text-gray-500 mb-6">今天，你的爱指数是...</p>
            
            <div className="relative w-48 h-48 mx-auto mb-6">
                <svg className="w-full h-full" viewBox="0 0 36 36">
                    <path className="text-pink-200" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2"></path>
                    <path className="text-pink-500" strokeDasharray={`${loveIndex}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" transform="rotate(-90 18 18)"></path>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold text-pink-600">{loveIndex}</span>
                    <span className="text-sm text-gray-500">Love Index</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg shadow">
                    <p className="text-3xl font-bold text-pink-500">{sentCount}</p>
                    <p className="text-gray-500">发出的爱</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <p className="text-3xl font-bold text-teal-500">{receivedCount}</p>
                    <p className="text-gray-500">收到的爱</p>
                </div>
            </div>
            
            <button onClick={() => openModal()} className="w-full bg-pink-500 text-white font-bold py-4 px-4 rounded-lg shadow-lg hover:bg-pink-600 transition-transform transform hover:scale-105 flex items-center justify-center">
                <Icon name="send" className="w-6 h-6 mr-2" />
                发送一个新的爱信号
            </button>
        </div>
    );
};

const LoveLog = ({ logs, userId, openModal }) => {
    return (
        <div>
            <h1 className="text-2xl font-bold text-pink-600 mb-4">爱日志</h1>
             <div className="space-y-4">
                {logs.map(log => (
                    <div key={log.id} className={`p-4 rounded-lg shadow relative ${log.senderId === userId ? 'bg-pink-100' : 'bg-teal-50'}`}>
                        <div className="flex items-start space-x-3">
                            <div className={`p-2 rounded-full ${log.senderId === userId ? 'bg-pink-200' : 'bg-teal-100'}`}>
                                <Icon name={log.senderId === userId ? 'send' : 'receive'} className={`w-5 h-5 ${log.senderId === userId ? 'text-pink-600' : 'text-teal-600'}`} />
                            </div>
                            <div>
                                <p className="font-bold text-gray-800">
                                    {log.senderId === userId ? `你发送给...` : `...发送给你`}
                                </p>
                                <p className="text-sm text-gray-500 break-all">
                                  {log.senderId === userId ? `接收人ID: ${log.recipientId || '未知'}` : `发送人ID: ${log.senderId || '未知'}`}
                                </p>
                                <p className="text-gray-700 mt-2">{log.description}</p>
                                <div className="flex items-center space-x-2 mt-2">
                                    <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">{log.type}</span>
                                    <span className="text-xs text-gray-400">{new Date(log.timestamp?.toDate()).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                         {log.senderId === userId && (
                            <div className="absolute top-2 right-2 flex space-x-2">
                                <button onClick={() => openModal(log)} className="p-1 text-gray-500 hover:text-blue-600"><Icon name="edit" className="w-4 h-4" /></button>
                                <button onClick={async () => {
                                  if (window.confirm("确定要删除这条爱信号吗?")) {
                                    const appId = 'love-signal-app';
                                    await deleteDoc(doc(db, "artifacts", appId, "public", "data", "signals", log.id));
                                  }
                                }} className="p-1 text-gray-500 hover:text-red-600"><Icon name="trash" className="w-4 h-4" /></button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
            {logs.length === 0 && <p className="text-center text-gray-500 mt-8">还没有任何爱信号记录，快去发送第一个吧！</p>}
        </div>
    );
};

const Challenges = () => (
    <div>
        <h1 className="text-2xl font-bold text-pink-600 mb-4">爱行动小挑战</h1>
        <div className="space-y-4">
             <div className="bg-white p-4 rounded-lg shadow flex justify-between items-center">
                <p>给家人发一条表达感谢的短信</p>
                <button className="text-pink-500 font-bold">完成</button>
            </div>
            <div className="bg-white p-4 rounded-lg shadow flex justify-between items-center">
                <p>给同事一个真诚的赞美</p>
                <button className="text-pink-500 font-bold">完成</button>
            </div>
             <div className="bg-white p-4 rounded-lg shadow flex justify-between items-center opacity-50">
                <p>主动倾听朋友五分钟不打断</p>
                <span className="text-gray-400">已完成</span>
            </div>
        </div>
    </div>
);
const RelationshipMap = () => (
     <div className="text-center text-gray-500 p-8">
        <Icon name="map" className="w-16 h-16 mx-auto mb-4 text-pink-300" />
        <h1 className="text-2xl font-bold text-pink-600 mb-2">关系图谱</h1>
        <p>此功能正在建设中，敬请期待！</p>
    </div>
);

const Reports = ({ logs, userId }) => {
    const data = ['赞美', '倾听', '帮助', '陪伴', '礼物', '肯定', '付出'].map(type => {
        const sent = logs.filter(log => log.senderId === userId && log.type === type).length;
        const received = logs.filter(log => log.recipientId === userId && log.type === type).length;
        return { name: type, sent, received };
    });

    return (
        <div>
            <h1 className="text-2xl font-bold text-pink-600 mb-4">个人洞察报告</h1>
             <div className="bg-white p-4 rounded-lg shadow h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="sent" fill="#ec4899" name="发出" />
                        <Bar dataKey="received" fill="#14b8a6" name="收到" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

const Settings = ({ userId }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (userId) {
            // Use execCommand for broader compatibility within iFrames
            const textArea = document.createElement("textarea");
            textArea.value = userId;
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                setCopied(true);
                setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
            } catch (err) {
                console.error('Failed to copy text: ', err);
            }
            document.body.removeChild(textArea);
        }
    };
    
    return (
        <div className="text-center">
            <Icon name="user" className="w-24 h-24 mx-auto mb-4 text-pink-300 bg-white rounded-full p-4 shadow" />
            <h1 className="text-2xl font-bold text-pink-600 mb-4">设置与个人资料</h1>
            <div className="bg-white p-4 rounded-lg shadow-md max-w-sm mx-auto">
                <p className="text-gray-600 mb-2">您的专属用户ID</p>
                <div className="bg-gray-100 p-2 rounded flex items-center justify-between">
                    <span className="text-gray-800 font-mono text-sm break-all">{userId || '加载中...'}</span>
                    <button onClick={handleCopy} className="p-2 rounded-md hover:bg-gray-200 transition">
                        <Icon name="copy" className="w-5 h-5 text-gray-600" />
                    </button>
                </div>
                {copied && <p className="text-green-600 text-sm mt-2">已成功复制到剪贴板！</p>}
                 <p className="text-gray-500 text-xs mt-2">
                    分享这个ID给您的朋友，让他们可以向您发送爱信号。
                </p>
            </div>
            <button onClick={() => auth.signOut()} className="mt-8 w-full max-w-sm mx-auto bg-red-500 text-white font-bold py-3 px-4 rounded-lg shadow hover:bg-red-600 transition">
                退出登录
            </button>
        </div>
    );
};

const LogModal = ({ closeModal, currentLog, userId }) => {
    const [recipientId, setRecipientId] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState('赞美');
    const formRef = useRef();

    useEffect(() => {
        if (currentLog) {
            setRecipientId(currentLog.recipientId || '');
            setDescription(currentLog.description || '');
            setType(currentLog.type || '赞美');
        }
    }, [currentLog]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (formRef.current && !formRef.current.contains(event.target)) {
                closeModal();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [closeModal]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!description.trim() || !recipientId.trim()) {
            alert("请填写接收人ID和事件描述！");
            return;
        }

        const appId = 'love-signal-app'; // Your unique app identifier
        const signalsCollection = collection(db, "artifacts", appId, "public", "data", "signals");

        const logData = {
            senderId: userId,
            recipientId,
            description,
            type,
            timestamp: serverTimestamp(),
        };

        if (currentLog) { // Editing existing log
            const logRef = doc(db, "artifacts", appId, "public", "data", "signals", currentLog.id);
            await updateDoc(logRef, logData);
        } else { // Creating new log
            await addDoc(signalsCollection, logData);
        }
        closeModal();
    };

    const loveTypes = ['赞美', '倾听', '帮助', '陪伴', '礼物', '肯定', '付出'];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div ref={formRef} className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-pink-600">{currentLog ? '编辑爱信号' : '发送爱信号'}</h2>
                    <button onClick={closeModal}><Icon name="x" className="w-6 h-6 text-gray-500" /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="recipientId">接收人ID</label>
                        <input id="recipientId" type="text" value={recipientId} onChange={(e) => setRecipientId(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" placeholder="粘贴朋友的用户ID" />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">事件描述</label>
                        <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" rows="3" placeholder="发生了什么？"></textarea>
                    </div>
                    <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-bold mb-2">爱信号类型</label>
                        <div className="relative">
                            <select value={type} onChange={(e) => setType(e.target.value)} className="block appearance-none w-full bg-white border border-gray-200 text-gray-700 py-3 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500">
                                {loveTypes.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                               <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center justify-end">
                        <button type="submit" className="bg-pink-500 hover:bg-pink-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                            {currentLog ? '更新' : '发送'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const BottomNav = ({ activeTab, setActiveTab }) => {
    const navItems = [
        { id: 'home', icon: 'home', label: '首页' },
        { id: 'logs', icon: 'book', label: '日志' },
        { id: 'challenges', icon: 'zap', label: '挑战' },
        // { id: 'map', icon: 'map', label: '图谱' },
        { id: 'reports', icon: 'barChart', label: '报告' },
        { id: 'settings', icon: 'settings', label: '设置' },
    ];
    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200">
            <div className="flex justify-around max-w-lg mx-auto">
                {navItems.map(item => (
                    <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex flex-col items-center justify-center w-full pt-2 pb-1 ${activeTab === item.id ? 'text-pink-600' : 'text-gray-500'}`}>
                        <Icon name={item.icon} className="w-6 h-6 mb-1" />
                        <span className="text-xs">{item.label}</span>
                    </button>
                ))}
            </div>
        </nav>
    );
};


