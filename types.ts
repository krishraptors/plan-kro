
export interface User {
  id: string;
  name: string;
  avatarUrl: string;
}

export interface Group {
  id: string;
  name: string;
  members: User[];
}

export interface Event {
  id: string;
  groupId: string;
  title: string;
  date: string;
  location: string;
  rsvps: { userId: string; status: 'going' | 'not-going' | 'maybe' }[];
}

export interface PollOption {
  id: string;
  text: string;
  votes: string[]; // array of user IDs
}

export interface Poll {
  id: string;
  groupId: string;
  question: string;
  options: PollOption[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text?: string;
  suggestions?: Suggestion[];
  isLoading?: boolean;
}

export interface Suggestion {
  name: string;
  type: 'Restaurant' | 'Movie' | 'Hangout Spot' | 'Other';
  rating: number;
  reason: string;
  address?: string; // For places
  posterUrl?: string; // For movies
}
