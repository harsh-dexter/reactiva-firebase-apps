
// Fix duplicate function name uploadVoiceMessage to sendVoiceMessage
uploadVoiceMessage: async (audioBlob: Blob) => {
  if (!currentUser || !currentRoom) {
    toast({
      title: "Error",
      description: "You must be logged in and in a room to send a voice message",
      variant: "destructive"
    });
    return null;
  }

  try {
    const messageId = await uploadVoiceMessage(currentRoom.id, currentUser.uid, audioBlob);
    return messageId;
  } catch (error) {
    console.error("Error uploading voice message:", error);
    toast({
      title: "Error", 
      description: "Failed to upload voice message",
      variant: "destructive"
    });
    return null;
  }
}
