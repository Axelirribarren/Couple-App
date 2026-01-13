import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';

// Map images manually or dynamically
const getAvatarImage = (character: string, mood: number) => {
    // This requires require() to be static usually, but dynamic require works in RN if paths are known. 
    // However, it's safer to have a map.
    
    // Constructing a map of all possibilities
    if (character === 'owl') {
        switch(mood) {
            case 1: return require('../img/owl/owl-1.png');
            case 2: return require('../img/owl/owl-2.png');
            case 3: return require('../img/owl/owl-3.png');
            case 4: return require('../img/owl/owl-4.png');
            case 5: return require('../img/owl/owl-5.png');
            default: return require('../img/owl/owl-3.png');
        }
    } else {
        // Alien
        switch(mood) {
            case 1: return require('../img/alien/alien-1.png');
            case 2: return require('../img/alien/alien-2.png');
            case 3: return require('../img/alien/alien-3.png');
            case 4: return require('../img/alien/alien-4.png');
            case 5: return require('../img/alien/alien-5.png');
            default: return require('../img/alien/alien-3.png');
        }
    }
};

export default function AvatarWidget() {
    const { user } = useAuth();

    if (!user || !user.character) return null;

    const imageSource = getAvatarImage(user.character, user.current_mood || 3);

    return (
        <View style={styles.container}>
            <Image source={imageSource} style={styles.image} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingRight: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: 40,
        height: 40,
        resizeMode: 'contain',
    },
});
