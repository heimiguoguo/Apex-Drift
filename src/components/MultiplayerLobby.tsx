import React, { useState } from 'react';
import { Users, Plus, Play, CheckCircle2, Circle, MessageSquare, Send, Trophy, ArrowLeft, RefreshCw, Zap } from 'lucide-react';
import { CarCustomization, RoomPublicInfo, TrackId } from '../types/game';
import { TRACK_CONFIGS } from '../utils/track-builder';

interface MultiplayerLobbyProps {
  rooms: RoomPublicInfo[];
  currentRoom: RoomPublicInfo | null;
  playerId: string;
  playerName: string;
  playerCar: CarCustomization;
  chatMessages: { playerId: string; playerName: string; text: string; timestamp: number }[];
  onRefreshRooms: () => void;
  onCreateRoom: (roomName: string, trackId: TrackId, laps: number) => void;
  onJoinRoom: (roomId: string) => void;
  onToggleReady: () => void;
  onStartRace: () => void;
  onLeaveRoom: () => void;
  onSendChatMessage: (text: string) => void;
  onBackToMenu: () => void;
}

export const MultiplayerLobby: React.FC<MultiplayerLobbyProps> = ({
  rooms,
  currentRoom,
  playerId,
  playerName,
  playerCar,
  chatMessages,
  onRefreshRooms,
  onCreateRoom,
  onJoinRoom,
  onToggleReady,
  onStartRace,
  onLeaveRoom,
  onSendChatMessage,
  onBackToMenu,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [selectedTrack, setSelectedTrack] = useState<TrackId>('cyber_neon');
  const [selectedLaps, setSelectedLaps] = useState<number>(2);
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [chatInput, setChatInput] = useState('');

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateRoom(newRoomName || `${playerName} 的竞速房`, selectedTrack, selectedLaps);
    setShowCreateModal(false);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onSendChatMessage(chatInput.trim());
    setChatInput('');
  };

  const quickTaunts = ['准备吃我的尾气吧!', '弯道快才是真的快!', '极速起飞!', 'GG! 好局!'];

  // INSIDE A ROOM LOBBY
  if (currentRoom) {
    const isHost = currentRoom.hostId === playerId;
    const myPlayer = currentRoom.players.find(p => p.id === playerId);
    const isReady = myPlayer?.isReady ?? false;
    const allReady = currentRoom.players.length > 0 && currentRoom.players.every(p => p.isReady);
    const trackConfig = TRACK_CONFIGS[currentRoom.trackId] || TRACK_CONFIGS.cyber_neon;

    return (
      <div className="relative w-full h-full bg-zinc-950 p-6 flex flex-col justify-between overflow-hidden font-sans">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onLeaveRoom}
              className="p-2.5 rounded-xl bg-zinc-900 border border-white/10 text-zinc-300 hover:text-white hover:bg-zinc-800 transition"
              title="退出房间"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-['Orbitron'] text-xl font-black text-white">{currentRoom.name}</h2>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-400/40 text-cyan-300">
                  ID: {currentRoom.id}
                </span>
              </div>
              <div className="text-xs text-zinc-400 mt-0.5">
                赛道: <span className="text-white font-medium">{trackConfig.name}</span> · 圈数: {currentRoom.laps} 圈
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold">车手席位</div>
              <div className="font-['Orbitron'] text-sm font-bold text-cyan-400">
                {currentRoom.playerCount} / 8
              </div>
            </div>
          </div>
        </div>

        {/* Center Grid: Left Players Roster + Right Chat & Quick Taunts */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 my-6 min-h-0">
          {/* Players Roster */}
          <div className="lg:col-span-2 bg-zinc-900/60 backdrop-blur-md border border-white/10 rounded-2xl p-5 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">房间车手名单</span>
              <span className="text-xs text-zinc-500">所有车手准备后房主即可发车</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3">
              {currentRoom.players.map((p, idx) => {
                const isMe = p.id === playerId;
                const isThisHost = currentRoom.hostId === p.id;
                return (
                  <div
                    key={p.id}
                    className={`p-4 rounded-xl border flex items-center justify-between transition ${
                      isMe ? 'bg-zinc-800/80 border-cyan-500/40 shadow-md shadow-cyan-500/10' : 'bg-zinc-900/80 border-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-white/10 flex items-center justify-center font-['Orbitron'] text-sm font-bold text-zinc-300">
                        #{idx + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">
                            {p.name} {isMe && <span className="text-xs text-cyan-400 font-normal">(你)</span>}
                          </span>
                          {isThisHost && (
                            <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/40 px-2 py-0.2 rounded font-semibold">
                              房主
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-zinc-400">
                          <span
                            className="w-2.5 h-2.5 rounded-full inline-block"
                            style={{ backgroundColor: p.paintColor || '#00f0ff' }}
                          />
                          <span>车型: {p.carModel || 'Apex GT'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {p.isReady ? (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                          <CheckCircle2 className="w-4 h-4" />
                          已准备
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium bg-zinc-800/60 px-3 py-1.5 rounded-lg border border-white/5">
                          <Circle className="w-4 h-4" />
                          准备中
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chat & Taunts */}
          <div className="bg-zinc-900/60 backdrop-blur-md border border-white/10 rounded-2xl p-5 flex flex-col justify-between overflow-hidden">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">房间语音互动</span>
            </div>

            {/* Messages box */}
            <div className="flex-1 overflow-y-auto space-y-2 mb-3 pr-1 text-xs">
              {chatMessages.length === 0 ? (
                <div className="text-center text-zinc-600 my-8">暂无消息，发送语音互动吧！</div>
              ) : (
                chatMessages.map((msg, i) => (
                  <div key={i} className="bg-zinc-800/60 p-2.5 rounded-xl border border-white/5">
                    <span className="font-semibold text-cyan-300">{msg.playerName}: </span>
                    <span className="text-zinc-200">{msg.text}</span>
                  </div>
                ))
              )}
            </div>

            {/* Quick Taunts */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 no-scrollbar">
              {quickTaunts.map(t => (
                <button
                  key={t}
                  onClick={() => onSendChatMessage(t)}
                  className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[11px] text-zinc-300 whitespace-nowrap border border-white/5 active:scale-95 transition"
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendChat} className="flex gap-2 mt-2">
              <input
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder="发送消息..."
                maxLength={40}
                className="flex-1 bg-zinc-800/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400"
              />
              <button
                type="submit"
                className="p-2 rounded-xl bg-cyan-500 text-zinc-950 font-bold hover:bg-cyan-400 transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Actions Bar */}
        <div className="border-t border-white/10 pt-4 flex items-center justify-between">
          <div className="text-xs text-zinc-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            联机连接正常 · 状态已同步
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onToggleReady}
              className={`px-6 py-3 rounded-xl font-bold text-xs transition active:scale-95 border ${
                isReady
                  ? 'bg-zinc-800 border-white/10 text-zinc-300 hover:bg-zinc-700'
                  : 'bg-cyan-500/20 border-cyan-400 text-cyan-300 hover:bg-cyan-500/30'
              }`}
            >
              {isReady ? '取消准备' : '准备就绪'}
            </button>

            {isHost && (
              <button
                onClick={onStartRace}
                disabled={!allReady}
                className={`flex items-center gap-2 px-8 py-3 rounded-xl font-['Orbitron'] font-black text-sm transition active:scale-95 ${
                  allReady
                    ? 'bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-zinc-950 shadow-lg shadow-cyan-500/25 cursor-pointer'
                    : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/5'
                }`}
              >
                <Play className="w-4 h-4 fill-current" />
                发车启动 (START)
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ROOMS LIST / LOBBY BROWSER
  return (
    <div className="relative w-full h-full bg-zinc-950 p-6 flex flex-col justify-between overflow-hidden font-sans">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBackToMenu}
            className="p-2.5 rounded-xl bg-zinc-900 border border-white/10 text-zinc-300 hover:text-white hover:bg-zinc-800 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-['Orbitron'] text-2xl font-black text-white flex items-center gap-2">
              <Users className="w-6 h-6 text-cyan-400" />
              全球多人对决大厅
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">与全球车手实时联网飙车，争夺赛道传奇纪录</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onRefreshRooms}
            className="p-2.5 rounded-xl bg-zinc-900 border border-white/10 text-zinc-300 hover:text-white hover:bg-zinc-800 transition"
            title="刷新大厅列表"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold text-xs transition active:scale-95 shadow-md shadow-cyan-500/20"
          >
            <Plus className="w-4 h-4" />
            创建房间
          </button>
        </div>
      </div>

      {/* Quick Join With Code Bar */}
      <div className="my-4 flex items-center gap-3 bg-zinc-900/60 backdrop-blur-md border border-white/10 p-3 rounded-2xl">
        <span className="text-xs text-zinc-400 font-medium pl-2">快速加入房间:</span>
        <input
          type="text"
          value={roomCodeInput}
          onChange={e => setRoomCodeInput(e.target.value.toUpperCase())}
          placeholder="输入房间号 (如 NEON-01)"
          className="bg-zinc-800/80 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400 font-mono"
        />
        <button
          onClick={() => roomCodeInput && onJoinRoom(roomCodeInput)}
          disabled={!roomCodeInput}
          className="px-4 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-cyan-400 border border-cyan-500/30 text-xs font-semibold disabled:opacity-50"
        >
          加入
        </button>
      </div>

      {/* Rooms Cards Grid */}
      <div className="flex-1 overflow-y-auto pr-1">
        <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">
          活跃对决房间 ({rooms.length})
        </div>

        {rooms.length === 0 ? (
          <div className="text-center py-20 text-zinc-500">
            暂无开放房间，点击右上角 “创建房间” 立即成为房主发起比赛！
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map(room => {
              const trackConfig = TRACK_CONFIGS[room.trackId] || TRACK_CONFIGS.cyber_neon;
              const isRacing = room.status === 'racing' || room.status === 'countdown';

              return (
                <div
                  key={room.id}
                  className="bg-zinc-900/70 backdrop-blur-md border border-white/10 rounded-2xl p-5 flex flex-col justify-between hover:border-cyan-500/40 transition group shadow-lg"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-['Orbitron'] font-bold text-white text-base group-hover:text-cyan-300 transition">
                          {room.name}
                        </h3>
                        <span className="font-mono text-[10px] text-zinc-500">ID: {room.id}</span>
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                          isRacing
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {isRacing ? '比赛进行中' : '等待发车'}
                      </span>
                    </div>

                    <div className="mt-4 space-y-1.5 text-xs text-zinc-400">
                      <div className="flex items-center justify-between">
                        <span>比赛赛道:</span>
                        <span className="text-zinc-200 font-medium">{trackConfig.name}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>总圈数:</span>
                        <span className="text-zinc-200 font-medium">{room.laps} 圈</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>已入场车手:</span>
                        <span className="text-cyan-400 font-['Orbitron'] font-bold">
                          {room.playerCount} / 8
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-end">
                    <button
                      onClick={() => onJoinRoom(room.id)}
                      disabled={isRacing || room.playerCount >= 8}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition active:scale-95 ${
                        isRacing || room.playerCount >= 8
                          ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                          : 'bg-cyan-500 hover:bg-cyan-400 text-zinc-950 shadow-md shadow-cyan-500/10'
                      }`}
                    >
                      {room.playerCount >= 8 ? '已满员' : isRacing ? '观战' : '立即加入'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE ROOM MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-white/15 rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="font-['Orbitron'] text-xl font-bold text-white mb-4">创建对决房间</h3>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">房间名称</label>
                <input
                  type="text"
                  value={newRoomName}
                  onChange={e => setNewRoomName(e.target.value)}
                  placeholder={`${playerName} 的竞速房`}
                  className="w-full bg-zinc-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">比赛赛道</label>
                <div className="grid grid-cols-1 gap-2">
                  {(['cyber_neon', 'red_rock', 'alpine_peak'] as TrackId[]).map(tId => {
                    const cfg = TRACK_CONFIGS[tId];
                    const selected = selectedTrack === tId;
                    return (
                      <button
                        type="button"
                        key={tId}
                        onClick={() => setSelectedTrack(tId)}
                        className={`p-3 rounded-xl border text-left transition flex items-center justify-between ${
                          selected ? 'bg-cyan-950/60 border-cyan-400 text-cyan-300' : 'bg-zinc-800/60 border-white/5 text-zinc-300'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-xs">{cfg.name}</div>
                          <div className="text-[11px] text-zinc-400">{cfg.subtitle}</div>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 border border-white/10 font-semibold">
                          {cfg.difficulty}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">竞赛圈数</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 5].map(laps => (
                    <button
                      type="button"
                      key={laps}
                      onClick={() => setSelectedLaps(laps)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition border ${
                        selectedLaps === laps
                          ? 'bg-cyan-500 border-cyan-400 text-zinc-950'
                          : 'bg-zinc-800 border-white/10 text-zinc-300 hover:bg-zinc-700'
                      }`}
                    >
                      {laps} 圈
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 text-xs font-bold font-['Orbitron'] transition"
                >
                  确认创建
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
