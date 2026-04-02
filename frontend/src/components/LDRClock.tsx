import React, { useState, useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';

interface LDRClockProps {
    partnerTimezoneOffset: string | null;
}

export default function LDRClock({ partnerTimezoneOffset }: LDRClockProps) {
    const [currentTimePartner, setCurrentTimePartner] = useState<string>('');

    useEffect(() => {
        let interval: any;
        if (partnerTimezoneOffset !== null) {
            // Initial call to set time immediately
            updateTime();

            interval = setInterval(updateTime, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };

        function updateTime() {
            const now = new Date();
            const offsetHours = parseFloat(partnerTimezoneOffset as string);
            if (!isNaN(offsetHours)) {
                // Convert local time to UTC, then apply partner offset
                const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
                const partnerTime = new Date(utc + (3600000 * offsetHours));
                const timeStr = partnerTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                setCurrentTimePartner(timeStr);
            }
        }
    }, [partnerTimezoneOffset]);

    if (!partnerTimezoneOffset) return null;

    return (
        <Text style={styles.ldrClock}>
            Partner's Time: {currentTimePartner || '--:--'}
        </Text>
    );
}

const styles = StyleSheet.create({
    ldrClock: {
        color: 'white',
        fontSize: 14,
        fontStyle: 'italic',
        marginTop: 10,
    },
});
