
import React from 'react';
import { useChat } from '../context/ChatContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { ScrollArea } from '@/components/ui/scroll-area';

interface RoomsListProps {
  onRoomSelect?: () => void;
}

const RoomsList: React.FC<RoomsListProps> = ({ onRoomSelect }) => {
  const isMobile = useIsMobile();
  const { rooms, currentRoom, setCurrentRoom } = useChat();

  const containerClass = isMobile 
    ? "h-full w-full bg-background p-4" 
    : "h-full w-64 border-r bg-background p-4";

  const handleRoomSelect = (room) => {
    setCurrentRoom(room);
    if (onRoomSelect) {
      onRoomSelect();
    }
  };

  return (
    <div className={containerClass}>
      <h2 className="mb-4 text-lg font-semibold">Chat Rooms</h2>
      
      <ScrollArea className="h-[calc(100%-2rem)]">
        <div className="space-y-1 pr-3">
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
                onClick={() => handleRoomSelect(room)}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                <span className="truncate">{room.name}</span>
              </Button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default RoomsList;
