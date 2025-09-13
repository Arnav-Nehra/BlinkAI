import { useEffect } from "react";
import { useExecutionStore } from "@/stores/executionStore";

export default function useExecutions() {
  const { executionList, setExecutionList } = useExecutionStore();

  const fetchExecutions = async () => {
    try {
      const EXECUTION_URL = "http://localhost:3000/ai/conversation";
      const token = localStorage.getItem("token");
      
      if (!token) {
        console.log("No token found");
        return;
      }

      const response = await fetch(EXECUTION_URL, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setExecutionList(data);
      
    } catch (error) {
      console.error("Error fetching executions:", error);
      setExecutionList([]);
    }
  };

  useEffect(() => {
    fetchExecutions();
  }, []);

  return {
    executionList,
    refetch: fetchExecutions
  };
}