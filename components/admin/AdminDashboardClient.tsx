"use client";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
    Users, Briefcase, Star, ShieldAlert, UserX,
    CheckCircle, MessageSquare, Database, AlertCircle, RefreshCw, LogOut
} from "lucide-react";
import { toast } from "react-hot-toast";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { getAllAdminDataAction, executeUserAction } from "@/app/actions/adminActions";

export default function AdminDashboardClient({ initialData }: { initialData: any }) {
    const [data, setData] = useState<any>(initialData);
    const [loading, setLoading] = useState(false);

    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [actionType, setActionType] = useState(""); 
    const [reason, setReason] = useState("");

    const fetchData = async () => {
        setLoading(true);
        const res = await getAllAdminDataAction();
        if (res.success) {
            setData(res);
        } else {
            toast.error("SYSTEM ERROR: Failed to sync with database");
        }
        setLoading(false);
    };

    const handleUserAction = async () => {
        if (!reason && actionType !== "activate") {
            return toast.error("System requires a reason for this action");
        }
        try {
            setLoading(true);
            const res = await executeUserAction(selectedUser._id, actionType, reason);
            if (res.success) {
                toast.success(`Protocol ${actionType} executed successfully`);
                setIsModalOpen(false);
                setReason("");
                await fetchData();
            } else {
                toast.error("Execution failed: " + res.error);
            }
        } catch (error) {
            toast.error("Execution failed: API unreachable");
        } finally {
            setLoading(false);
        }
    };

    // نستخدم حالة تحميل بسيطة فقط عند الضغط على Re-Sync
    if (loading && !data) return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f172a] text-blue-400 font-mono">
            <Database className="animate-spin mb-4" size={40} />
            <p className="tracking-[0.2em] animate-pulse">LOADING_SYSTEM_DATA_...</p>
        </div>
    );

    return (
        <div className="p-6 space-y-8 bg-[#0f172a] min-h-screen font-mono text-slate-300">
            {/* Header Area */}
            <div className="flex justify-between items-center border-b border-slate-800 pb-6">
                <div>
                    <h1 className="text-2xl font-black text-white tracking-tighter flex items-center gap-3">
                        MASTER CONTROL PANEL
                    </h1>
                    <p className="text-[10px] text-slate-500 mt-1 uppercase">Centralized Database Oversight & Content Moderation</p>
                </div>
                <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto pl-10">
                    <button
                        onClick={fetchData}
                        className="flex items-center justify-center gap-2 text-[10px] bg-slate-800 hover:bg-slate-700 px-4 py-3 md:py-2 rounded border border-slate-700 text-white transition active:scale-95 w-full md:w-auto font-bold"
                    >
                        <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                        RE-SYNC
                    </button>

                    <Link href='/dashboard' className="w-full md:w-auto">
                        <button className="flex items-center justify-center gap-2 text-[10px] bg-green-900/20 hover:bg-green-800/40 px-4 py-3 md:py-2 rounded border border-green-700/50 text-green-500 transition active:scale-95 w-full font-bold">
                            <Users size={14} />
                            USER_VIEW
                        </button>
                    </Link>

                    <button
                        onClick={() => signOut({ callbackUrl: '/' })}
                        className="flex items-center justify-center gap-2 text-[10px] bg-red-900/20 hover:bg-red-900/40 px-4 py-3 md:py-2 rounded border border-red-900/50 text-red-500 transition active:scale-95 w-full md:w-auto font-bold"
                    >
                        <LogOut size={14} />
                        TERMINATE
                    </button>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Total Registered Users" count={data.stats.totalUsers} icon={<Users />} color="blue" />
                <StatCard title="Total Published Services" count={data.stats.totalServices} icon={<Briefcase />} color="green" />
                <StatCard title="Total User Reviews" count={data.stats.totalReviews} icon={<Star />} color="yellow" />
            </div>

            <Tabs defaultValue="users" className="w-full">
                <TabsList className="bg-slate-900 border border-slate-800 p-1 mb-6">
                    <TabsTrigger value="users" className="data-[state=active]:bg-blue-600">USERS</TabsTrigger>
                    <TabsTrigger value="services" className="data-[state=active]:bg-green-600">SERVICES</TabsTrigger>
                    <TabsTrigger value="reviews" className="data-[state=active]:bg-yellow-600 text-yellow-500 data-[state=active]:text-white">REVIEWS</TabsTrigger>
                </TabsList>

                {/* 1. USERS TAB */}
                <TabsContent value="users">
                    <Card className="bg-slate-900 border-slate-800">
                        <CardHeader><CardTitle className="text-white text-sm">USER_DATABASE_TRACE</CardTitle></CardHeader>
                        <CardContent className="p-0 overflow-auto">
                            <table className="w-full text-left text-[11px]">
                                <thead className="bg-black text-slate-500 uppercase">
                                    <tr>
                                        <th className="p-4 border-b border-slate-800">Identity & Credentials</th>
                                        <th className="p-4 border-b border-slate-800">Phone/Contact</th>
                                        <th className="p-4 border-b border-slate-800 text-center">Status/Risk</th>
                                        <th className="p-4 border-b border-slate-800 text-right">Execution</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {data.users.map((user: any) => (
                                        <tr key={user._id} className="hover:bg-slate-800/40 transition">
                                            <td className="p-4">
                                                <div className="text-white font-bold uppercase">{user.name}</div>
                                                <div className="text-slate-500 italic lowercase font-sans">{user.email}</div>
                                                <div className="text-[9px] text-blue-500 mt-1">UUID: {user._id}</div>
                                            </td>
                                            <td className="p-4 font-mono text-green-500">{user.phone || "UNLINKED"}</td>
                                            <td className="p-4 text-center">
                                                <div className="flex flex-col gap-1 items-center">
                                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${user.status === 'active' ? 'bg-green-900/30 text-green-500' : 'bg-red-900/30 text-red-500'}`}>
                                                        {user.status.toUpperCase()}
                                                    </span>
                                                    <span className="text-red-400 text-[9px]">WARNS: {user.warnings || 0}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => { setSelectedUser(user); setActionType("warn"); setIsModalOpen(true); }} className="p-2 text-yellow-500 border border-yellow-900/50 rounded hover:bg-yellow-900/20"><ShieldAlert size={14} /></button>
                                                    {user.status === "active" ? (
                                                        <button onClick={() => { setSelectedUser(user); setActionType("suspend"); setIsModalOpen(true); }} className="p-2 text-red-500 border border-red-900/50 rounded hover:bg-red-900/20"><UserX size={14} /></button>
                                                    ) : (
                                                        <button onClick={() => { setSelectedUser(user); setActionType("activate"); handleUserAction(); }} className="p-2 text-green-500 border border-green-900/50 rounded hover:bg-green-900/20"><CheckCircle size={14} /></button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* 2. SERVICES TAB */}
                <TabsContent value="services">
                    <Card className="bg-slate-900 border-slate-800">
                        <CardHeader><CardTitle className="text-white text-sm uppercase italic">Live_Service_Monitoring</CardTitle></CardHeader>
                        <CardContent className="p-0 overflow-auto">
                            <table className="w-full text-left text-[11px]">
                                <thead className="bg-black text-slate-500 uppercase">
                                    <tr>
                                        <th className="p-4 border-b border-slate-800">Service Metadata</th>
                                        <th className="p-4 border-b border-slate-800">Owner Identity</th>
                                        <th className="p-4 border-b border-slate-800">Price Point</th>
                                        <th className="p-4 border-b border-slate-800">Security</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.services.map((srv: any) => (
                                        <tr key={srv._id} className="hover:bg-slate-800/40 border-b border-slate-800/30">
                                            <td className="p-4">
                                                <div className="text-white font-bold truncate max-w-[150px] uppercase">{srv.title}</div>
                                                <div className="text-[9px] text-slate-500 truncate max-w-[200px]">{srv.description}</div>
                                                <div className="text-[9px] text-blue-500 mt-1 italic underline">ID: {srv._id}</div>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-white font-bold italic">{srv.ownerId?.name}</div>
                                                <div className="text-slate-500 font-sans">{srv.ownerId?.email}</div>
                                                <div className="text-[9px] text-blue-400 uppercase font-bold mt-1">UID: {srv.ownerId?._id}</div>
                                            </td>
                                            <td className="p-4 font-black text-green-500 text-xs">${srv.price}</td>
                                            <td className="p-4">
                                                <div className="flex flex-col gap-1">
                                                    <button onClick={() => { setSelectedUser(srv.ownerId); setActionType("warn"); setIsModalOpen(true); }} className="text-yellow-600 hover:underline text-left">FLAG_OWNER</button>
                                                    <button onClick={() => { setSelectedUser(srv.ownerId); setActionType("suspend"); setIsModalOpen(true); }} className="text-red-600 hover:underline text-left">SUSPEND_OWNER</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* 3. REVIEWS TAB */}
                <TabsContent value="reviews">
                    <Card className="bg-slate-900 border-slate-800">
                        <CardHeader className="border-b border-slate-800">
                            <CardTitle className="text-sm flex items-center gap-2 text-yellow-500 italic uppercase">
                                <MessageSquare size={16} /> Content Inspection / Spam Control
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 overflow-auto max-h-[600px]">
                            <table className="w-full text-left text-[11px]">
                                <thead className="bg-black text-slate-500">
                                    <tr>
                                        <th className="p-4 border-b border-slate-800">RATING</th>
                                        <th className="p-4 border-b border-slate-800">USER_COMMENT</th>
                                        <th className="p-4 border-b border-slate-800">REVIEW_AUTHOR</th>
                                        <th className="p-4 border-b border-slate-800 text-right">ACTION</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {data.reviews.map((rev: any) => (
                                        <tr key={rev._id} className="hover:bg-red-900/10 transition">
                                            <td className="p-4 text-center">
                                                <div className="bg-slate-800 p-2 rounded text-yellow-500 font-bold text-xs">{rev.rating} ★</div>
                                            </td>
                                            <td className="p-4 max-w-[200px]">
                                                <p className="text-slate-200 bg-black/50 p-2 rounded italic font-sans leading-relaxed">"{rev.comment}"</p>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-white font-bold italic">{rev.clientId?.name}</div>
                                                <div className="text-[9px] text-slate-500">ID: {rev.clientId?._id}</div>
                                            </td>
                                            <td className="p-4 text-right">
                                                <button onClick={() => { setSelectedUser(rev.clientId); setActionType("warn"); setIsModalOpen(true); }} className="text-red-500 bg-red-900/10 px-2 py-1 rounded border border-red-900/30 hover:bg-red-900/30 transition text-[9px] font-black uppercase">Warn_Author</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* ACTION MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
                    <div className="bg-[#1e293b] border-t-2 border-red-600 p-6 md:p-8 w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh]">
                        <div className="flex items-center gap-3 mb-4 text-red-500">
                            <AlertCircle size={24} />
                            <h2 className="text-lg md:text-xl font-black italic uppercase tracking-tighter">System_Protocol_{actionType.toUpperCase()}</h2>
                        </div>
                        <div className="bg-black/40 p-3 border border-slate-700 mb-6 font-mono text-[10px] break-all">
                            <p className="text-slate-400">TARGET: <span className="text-white">{selectedUser?.name}</span></p>
                            <p className="text-slate-400">EMAIL: <span className="text-white">{selectedUser?.email}</span></p>
                            <p className="text-slate-400">ID: <span className="text-blue-400">{selectedUser?._id}</span></p>
                        </div>
                        <textarea
                            className="w-full bg-black border border-slate-700 p-4 text-white font-mono text-xs h-32 md:h-40 outline-none focus:border-red-600 transition-colors"
                            placeholder="REASON_FOR_MODERATION_ACTION..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        />
                        <div className="flex flex-col sm:flex-row justify-end gap-4 mt-8">
                            <button onClick={() => setIsModalOpen(false)} className="order-2 sm:order-1 text-slate-500 hover:text-white font-bold text-[10px] uppercase tracking-widest py-2">Abort_Command</button>
                            <button onClick={handleUserAction} className="order-1 sm:order-2 bg-red-600 text-white px-8 py-3 font-black text-[10px] uppercase hover:bg-red-700 transition tracking-widest">Execute_Action</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Stats Card Component (كما هو بدون تغيير)
function StatCard({ title, count, icon, color }: any) {
    const colorMap: any = {
        blue: "border-t-blue-500 text-blue-500",
        green: "border-t-green-500 text-green-500",
        yellow: "border-t-yellow-500 text-yellow-500",
    };
    return (
        <Card className={`bg-slate-900 border-slate-800 rounded-none border-t-2 ${colorMap[color]}`}>
            <CardContent className="p-6 flex items-center justify-between">
                <div>
                    <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest">{title}</p>
                    <p className="text-3xl font-black text-white mt-1 italic">{count}</p>
                </div>
                <div className="opacity-20">{icon}</div>
            </CardContent>
        </Card>
    );
}