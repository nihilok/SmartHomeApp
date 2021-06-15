import React, {useEffect, useState} from "react";

export function ReturnTasks(name) {
        const [tasks, setTasks] = useState(null)
        const [error, setError] = useState(null);
        const [loading, setLoading] = useState(true)

        async function GetTasks() {
            try {
                setLoading(true);
                const tasks = await fetch("http://127.0.0.1:8080/api/tasks").then(response =>
                    response.json().then((data) => {
                        console.log(data[name])
                        return data[name]
                    }));
                setTasks(tasks);
            } catch (e) {
                setError(e);
            } finally {
                setLoading(false);
            }
        }

        useEffect(() => {
            GetTasks();
        }, []);

        if (error) return "Failed to load resource A";
        return loading ? "Loading..." : tasks;
    }