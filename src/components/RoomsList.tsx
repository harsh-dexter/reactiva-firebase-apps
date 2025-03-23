
import React from 'react';
import { useChat } from '../context/ChatContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';

const RoomsList: React.FC = () => {
  const { rooms, currentRoom, setCurrentRoom } = useChat();

  return (
    <div className="h-full w-64 border-r bg-background p-4">
      <h2 className="mb-4 text-lg font-semibold">Chat Rooms</h2>
      
      <div className="space-y-1">
        {rooms.length === 0 ? (
          <p className="text-sm text-muted-foreground">No rooms available</p>
        ) : (
          rooms.map((room) => (
            <Button
              key={room.id}
              variant="ghost"
              className={cn(
                "w-full justify-start",
                currentRoom?.id === room.id && "bg-accent"
              )}
              onClick={() => setCurrentRoom(room)}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              <span className="truncate">{room.name}</span>
            </Button>
          ))
        )}
      </div>
    </div>
  );
};

export default RoomsList;
