
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2 text-gray-800">ChatPaglu</h1>
          <p className="text-xl text-gray-600 mb-6">The perfect place for all chatpaglus</p>
          
          <div className="space-y-4">
            <p className="text-gray-600">
              Join the anonymous chat platform where you can talk freely without sharing personal information.
            </p>
            
            <Link to="/chat">
              <Button className="w-full py-6 text-lg">
                Start Chatting
              </Button>
            </Link>
            
            <p className="text-sm text-gray-500 mt-8">
              No registration required. Just click and start chatting instantly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
