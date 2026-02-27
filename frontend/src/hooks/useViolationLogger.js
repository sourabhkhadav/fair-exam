import { useState, useCallback } from 'react';

export const useViolationLogger = () => {
    const [violations, setViolations] = useState([]);

    const logViolation = useCallback((type, description) => {
        const violation = {
            id: Date.now(),
            time: new Date().toLocaleTimeString(),
            type,
            description,
            timestamp: Date.now()
        };
        
        setViolations(prev => [...prev, violation]);
        
        console.log('🚨 VIOLATION LOGGED:', violation);
        
        return violation;
    }, []);

    const getViolationSummary = useCallback(() => {
        const summary = {
            total: violations.length,
            byType: {}
        };
        
        violations.forEach(v => {
            summary.byType[v.type] = (summary.byType[v.type] || 0) + 1;
        });
        
        return summary;
    }, [violations]);

    const clearViolations = useCallback(() => {
        setViolations([]);
    }, []);

    return {
        violations,
        logViolation,
        getViolationSummary,
        clearViolations
    };
};
