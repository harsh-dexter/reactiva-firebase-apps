
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, 
  LogOut, 
  Users, 
  PlusCircle,
  Menu
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface ChatHeaderProps {
  onMenuClick?: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ onMenuClick }) => {
  const isMobile = useIsMobile();
  const { currentUser, logout } = useAuth();
  const { currentRoom, rooms } = useChat();
  const { toast } = useToast();
  const [isCreateRoomOpen, setIsCreateRoomOpen] = React.useState(false);
  const [newRoomName, setNewRoomName] = React.useState('');
  const [newRoomDescription, setNewRoomDescription] = React.useState('');
  const { createRoom } = useChat();

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) {
      toast({
        title: 'Error',
        description: 'Room name is required',
        variant: 'destructive',
      });
      return;
    }

    await createRoom(newRoomName, newRoomDescription);
    setNewRoomName('');
    setNewRoomDescription('');
    setIsCreateRoomOpen(false);
  };

  return (
    <header className="flex items-center justify-between px-4 py-3 bg-background border-b">
      <div className="flex items-center">
        {isMobile ? (
          <Button variant="ghost" size="icon" onClick={onMenuClick} className="mr-2">
            <Menu className="h-5 w-5 text-muted-foreground" />
          </Button>
        ) : (
          <ChevronLeft className="h-5 w-5 mr-2 text-muted-foreground md:hidden" />
        )}
        <div>
          <h1 className="font-semibold">{currentRoom?.name || 'Select a room'}</h1>
          <p className="text-xs text-muted-foreground">
            {currentRoom 
              ? currentRoom.description 
              : `${rooms.length} available rooms`}
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Dialog open={isCreateRoomOpen} onOpenChange={setIsCreateRoomOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon">
              <PlusCircle className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a new room</DialogTitle>
              <DialogDescription>
                Create a new chat room that anyone can join.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Room name</Label>
                <Input 
                  id="name" 
                  value={newRoomName} 
                  onChange={(e) => setNewRoomName(e.target.value)} 
                  placeholder="E.g., General Chat" 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  value={newRoomDescription} 
                  onChange={(e) => setNewRoomDescription(e.target.value)} 
                  placeholder="A brief description of this room" 
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateRoom}>Create Room</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Button variant="outline" size="icon">
          <Users className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={logout}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
};

export default ChatHeader;
