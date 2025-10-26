
import React, { useState, useCallback, useMemo } from 'react';
import { User, Group, Event, Poll, ChatMessage, Suggestion } from './types';
import { bot } from './services/geminiService';
import { UsersIcon, CalendarIcon, MapPinIcon, PlusIcon, SendIcon, BotIcon } from './components/Icons';

// --- MOCK DATA ---
const users: User[] = [
  { id: 'u1', name: 'Rohan', avatarUrl: 'https://i.pravatar.cc/150?u=rohan' },
  { id: 'u2', name: 'Priya', avatarUrl: 'https://i.pravatar.cc/150?u=priya' },
  { id: 'u3', name: 'Aarav', avatarUrl: 'https://i.pravatar.cc/150?u=aarav' },
  { id: 'u4', name: 'Saanvi', avatarUrl: 'https://i.pravatar.cc/150?u=saanvi' },
];
const currentUser = users[0];

const initialGroups: Group[] = [
  { id: 'g1', name: 'Weekend Warriors', members: [users[0], users[1], users[3]] },
  { id: 'g2', name: 'Foodie Fam', members: [users[0], users[2], users[3]] },
  { id: 'g3', name: 'Movie Buffs', members: [users[0], users[1], users[2]] },
];

const initialEvents: Event[] = [
  { id: 'e1', groupId: 'g1', title: 'Trip to Jaipur', date: 'Sat, Nov 16', location: 'Jaipur, Rajasthan', rsvps: [{ userId: 'u1', status: 'going' }, { userId: 'u2', status: 'going' }, { userId: 'u4', status: 'maybe' }] },
  { id: 'e2', groupId: 'g2', title: 'Dilli Chaat Crawl', date: 'Sun, Nov 10', location: 'Chandni Chowk, Delhi', rsvps: [{ userId: 'u1', status: 'going' }, { userId: 'u3', status: 'going' }] },
];

const initialPolls: Poll[] = [
  {
    id: 'p1', groupId: 'g3', question: 'What movie should we watch this Friday?',
    options: [
      { id: 'o1', text: 'Jawan 🎬', votes: ['u1', 'u3'] },
      { id: 'o2', text: 'RRR (rewatch!) 🔥', votes: ['u2'] },
      { id: 'o3', text: '3 Idiots (classic!) 😂', votes: [] },
    ]
  },
  {
    id: 'p2', groupId: 'g1', question: 'Best time for the trip?',
    options: [
      { id: 'o4', text: 'Early Morning (6 AM)', votes: ['u2'] },
      { id: 'o5', text: 'Afternoon (1 PM)', votes: ['u1', 'u4'] },
    ]
  }
];

// --- COMPONENTS ---

const Header = () => (
    <header className="bg-card-bg shadow-md p-4 sticky top-0 z-20">
      <h1 className="text-3xl font-bold font-serif text-primary text-center">Jashn Planner</h1>
      <p className="text-center text-text-light">Your festive planning partner! 🎉</p>
    </header>
);

const GroupList: React.FC<{
    groups: Group[],
    selectedGroupId: string | null,
    onSelectGroup: (id: string) => void
}> = ({ groups, selectedGroupId, onSelectGroup }) => (
    <aside className="w-full md:w-1/4 lg:w-1/5 bg-card-bg p-4 rounded-lg shadow-lg self-start">
        <h2 className="text-xl font-bold text-text-dark mb-4 border-b-2 border-primary pb-2">Your Groups</h2>
        <ul>
            {groups.map(group => (
                <li key={group.id} 
                    onClick={() => onSelectGroup(group.id)}
                    className={`p-3 rounded-lg mb-2 cursor-pointer transition-all duration-200 flex items-center justify-between ${selectedGroupId === group.id ? 'bg-primary text-white shadow-md' : 'hover:bg-orange-100'}`}>
                    <span className="font-semibold">{group.name}</span>
                    <div className="flex items-center">
                        <UsersIcon className="w-4 h-4 mr-1"/>
                        <span>{group.members.length}</span>
                    </div>
                </li>
            ))}
        </ul>
        <button className="w-full mt-4 bg-secondary hover:bg-teal-500 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center transition-transform duration-200 hover:scale-105">
            <PlusIcon className="w-5 h-5 mr-2"/>
            Create Group
        </button>
    </aside>
);

const EventCard: React.FC<{ event: Event, members: User[] }> = ({ event, members }) => {
    const getAvatar = (userId: string) => members.find(m => m.id === userId)?.avatarUrl;
    return (
        <div className="bg-card-bg p-4 rounded-lg shadow-md mb-4 transition-shadow hover:shadow-xl">
            <h3 className="text-lg font-bold text-primary">{event.title}</h3>
            <div className="text-sm text-text-light flex items-center my-2">
                <CalendarIcon className="w-4 h-4 mr-2 text-secondary" />
                <span>{event.date}</span>
            </div>
            <div className="text-sm text-text-light flex items-center mb-3">
                <MapPinIcon className="w-4 h-4 mr-2 text-secondary" />
                <span>{event.location}</span>
            </div>
            <div>
                <h4 className="font-semibold text-text-dark text-sm mb-2">RSVPs:</h4>
                <div className="flex items-center space-x-2">
                    {event.rsvps.map(rsvp => (
                        <div key={rsvp.userId} className="group relative">
                            <img src={getAvatar(rsvp.userId)} alt="avatar" className={`w-8 h-8 rounded-full border-2 ${rsvp.status === 'going' ? 'border-green-500' : rsvp.status === 'maybe' ? 'border-yellow-500' : 'border-red-500'}`}/>
                            <span className="absolute bottom-full mb-2 w-max px-2 py-1 bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                {members.find(m=>m.id === rsvp.userId)?.name} - {rsvp.status}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const PollCard: React.FC<{ poll: Poll, onVote: (pollId: string, optionId: string) => void, currentUserId: string }> = ({ poll, onVote, currentUserId }) => {
    const totalVotes = poll.options.reduce((acc, opt) => acc + opt.votes.length, 0);
    return (
        <div className="bg-card-bg p-4 rounded-lg shadow-md mb-4 transition-shadow hover:shadow-xl">
            <h3 className="text-lg font-bold text-primary mb-3">{poll.question}</h3>
            <div className="space-y-2">
                {poll.options.map(option => {
                    const hasVoted = option.votes.includes(currentUserId);
                    const votePercentage = totalVotes > 0 ? (option.votes.length / totalVotes) * 100 : 0;
                    return (
                        <div key={option.id} className="group">
                             <div className="flex justify-between items-center text-sm mb-1">
                                <span className="font-medium text-text-dark">{option.text}</span>
                                <span className="text-text-light font-semibold">{option.votes.length} vote(s)</span>
                            </div>
                            <div className="relative w-full bg-orange-100 rounded-full h-6">
                                <div className="bg-accent h-6 rounded-full" style={{ width: `${votePercentage}%` }}></div>
                                <button 
                                    onClick={() => onVote(poll.id, option.id)}
                                    className={`absolute inset-0 flex items-center justify-end pr-4 text-lg transition-opacity ${hasVoted ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                                >
                                    {hasVoted ? '👍' : 'Vote'}
                                </button>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
};

const SuggestionCard: React.FC<{ suggestion: Suggestion }> = ({ suggestion }) => (
    <div className="bg-white border-2 border-accent rounded-lg p-4 w-full md:w-2/3 shadow-lg my-2 transition-transform hover:scale-105">
        <div className="flex justify-between items-start">
            <h4 className="font-bold text-secondary text-lg">{suggestion.name}</h4>
            <div className="flex items-center bg-accent text-yellow-800 font-bold px-2 py-1 rounded-full text-sm">
                <span>⭐</span>
                <span className="ml-1">{suggestion.rating}/5</span>
            </div>
        </div>
        <p className="text-sm bg-gray-100 px-2 py-1 rounded-md inline-block my-2 text-text-dark">{suggestion.type}</p>
        <p className="text-text-light">{suggestion.reason}</p>
    </div>
);


const Chatbot: React.FC<{
  messages: ChatMessage[],
  onSendMessage: (message: string) => void,
  isLoading: boolean
}> = ({ messages, onSendMessage, isLoading }) => {
    const [input, setInput] = useState('');

    const handleSend = () => {
        if (input.trim()) {
            onSendMessage(input.trim());
            setInput('');
        }
    };

    return (
        <div className="fixed bottom-4 right-4 w-96 bg-card-bg rounded-2xl shadow-2xl flex flex-col h-[600px] z-50 transition-all duration-300">
            <div className="bg-primary p-4 rounded-t-2xl text-white flex items-center">
                <BotIcon className="w-8 h-8 mr-3"/>
                <div>
                    <h3 className="text-xl font-bold font-serif">PlanPal Bot</h3>
                    <p className="text-sm opacity-90">Your planning assistant!</p>
                </div>
            </div>
            <div className="flex-1 p-4 overflow-y-auto bg-background">
                <div className="flex flex-col space-y-4">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.sender === 'bot' && <img src="https://i.pravatar.cc/150?u=planpal" className="w-8 h-8 rounded-full"/>}
                            <div className={`max-w-xs md:max-w-md lg:max-w-xs rounded-xl p-3 ${msg.sender === 'user' ? 'bg-secondary text-white rounded-br-none' : 'bg-white text-text-dark rounded-bl-none'}`}>
                                {msg.isLoading && <div className="flex items-center justify-center space-x-1"><div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div><div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-75"></div><div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-150"></div></div>}
                                {msg.text}
                                {msg.suggestions && (
                                    <div className="mt-2 space-y-2">
                                        {msg.suggestions.map((s, i) => <SuggestionCard key={i} suggestion={s}/>)}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="p-4 border-t border-gray-200">
                <div className="flex items-center bg-gray-100 rounded-full p-1">
                    <input 
                        type="text" 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask for suggestions..." 
                        className="flex-1 bg-transparent px-4 py-2 text-text-dark focus:outline-none"
                    />
                    <button onClick={handleSend} disabled={isLoading} className="bg-primary hover:bg-primary-dark text-white rounded-full p-2 disabled:bg-gray-400 transition-colors">
                        <SendIcon className="w-5 h-5"/>
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- APP ---

export default function App() {
    const [groups, setGroups] = useState<Group[]>(initialGroups);
    const [events, setEvents] = useState<Event[]>(initialEvents);
    const [polls, setPolls] = useState<Poll[]>(initialPolls);
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(initialGroups[0]?.id || null);

    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
        { id: '1', sender: 'bot', text: "Chalo, let's plan something awesome! How can I help you today? Try asking me to 'suggest some chill cafes in Mumbai'!" }
    ]);
    const [isBotLoading, setIsBotLoading] = useState(false);

    const handleSendMessage = useCallback(async (message: string) => {
        const userMessage: ChatMessage = { id: Date.now().toString(), sender: 'user', text: message };
        setChatMessages(prev => [...prev, userMessage]);
        setIsBotLoading(true);

        const loadingMessage: ChatMessage = { id: 'loading', sender: 'bot', isLoading: true };
        setChatMessages(prev => [...prev, loadingMessage]);

        const botResponse = await bot.sendMessage(message);
        setChatMessages(prev => prev.filter(m => m.id !== 'loading'));
        setChatMessages(prev => [...prev, botResponse]);
        setIsBotLoading(false);
    }, []);

    const selectedGroup = useMemo(() => {
        return groups.find(g => g.id === selectedGroupId);
    }, [groups, selectedGroupId]);

    const handleVote = (pollId: string, optionId: string) => {
        setPolls(prevPolls => prevPolls.map(poll => {
            if (poll.id === pollId) {
                const newOptions = poll.options.map(opt => {
                    // Remove vote from other options if already voted
                    const updatedVotes = opt.votes.filter(voterId => voterId !== currentUser.id);
                    // Add vote to the selected option
                    if (opt.id === optionId) {
                        // If not already voted, add vote. If voted, this will toggle it off.
                        if (!opt.votes.includes(currentUser.id)) {
                             updatedVotes.push(currentUser.id);
                        }
                    }
                    return { ...opt, votes: updatedVotes };
                });
                return { ...poll, options: newOptions };
            }
            return poll;
        }));
    };

    return (
        <div className="min-h-screen bg-background font-sans text-text-dark">
            <Header />
            <main className="p-4 md:p-8">
                <div className="flex flex-col md:flex-row gap-8">
                    <GroupList 
                        groups={groups} 
                        selectedGroupId={selectedGroupId} 
                        onSelectGroup={setSelectedGroupId} 
                    />
                    <section className="w-full md:w-3/4 lg:w-4/5">
                        {selectedGroup ? (
                            <div>
                                <h2 className="text-2xl font-bold text-text-dark mb-4">
                                    Plans for <span className="text-primary">{selectedGroup.name}</span>
                                </h2>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div>
                                        <h3 className="text-xl font-semibold mb-3 text-text-light">Upcoming Events</h3>
                                        {events.filter(e => e.groupId === selectedGroupId).map(event => (
                                            <EventCard key={event.id} event={event} members={selectedGroup.members} />
                                        ))}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-semibold mb-3 text-text-light">Active Polls</h3>
                                        {polls.filter(p => p.groupId === selectedGroupId).map(poll => (
                                            <PollCard key={poll.id} poll={poll} onVote={handleVote} currentUserId={currentUser.id}/>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-64 bg-card-bg rounded-lg shadow-md">
                                <p className="text-xl text-text-light">Select a group to see the plans!</p>
                            </div>
                        )}
                    </section>
                </div>
            </main>
            <Chatbot messages={chatMessages} onSendMessage={handleSendMessage} isLoading={isBotLoading} />
        </div>
    );
}
