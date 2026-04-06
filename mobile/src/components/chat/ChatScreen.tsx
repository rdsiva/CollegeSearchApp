import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
  Text,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useChat } from '@/context/ChatContext';
import { sendChat } from '@/api/client';
import { Colors } from '@/constants/colors';
import MessageBubble from './MessageBubble';
import SuggestionChips from './SuggestionChips';
import type { ChatMessage } from '@/types';

const DEFAULT_SUGGESTIONS = [
  'What is the TNEA counselling process?',
  'How are cutoff marks calculated?',
  'Which Chennai colleges are good for CSE?',
  'What is the difference between OC and BC cutoffs?',
];

export default function ChatScreen() {
  const { messages, activeCollege, addMessage } = useChat();
  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<string[]>(
    activeCollege == null ? DEFAULT_SUGGESTIONS : []
  );
  const listRef = useRef<FlatList<ChatMessage>>(null);

  useEffect(() => {
    setSuggestions(activeCollege == null ? DEFAULT_SUGGESTIONS : []);
  }, [activeCollege]);

  const handleSend = async () => {
    // M1: hard-cap message length even if set programmatically (e.g. from suggestion chips)
    const text = inputText.trim().slice(0, 1000);
    if (!text || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: text };
    addMessage(userMessage);
    setInputText('');
    setIsLoading(true);
    setSuggestions([]);

    try {
      const response = await sendChat(text, activeCollege?.code ?? null, messages);
      const assistantMessage: ChatMessage = { role: 'assistant', content: response.reply };
      addMessage(assistantMessage);
      if (response.suggestions && response.suggestions.length > 0) {
        setSuggestions(response.suggestions);
      }
    } catch (e) {
      // M3: show generic error to user; raw server errors may leak backend details
      console.error('Chat error:', e);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Sorry, I could not get a response right now. Please try again.',
      };
      addMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.contextBanner}>
        <Feather
          name={activeCollege ? 'info' : 'help-circle'}
          size={14}
          color={Colors.primary}
          style={styles.bannerIcon}
        />
        <Text style={styles.bannerText} numberOfLines={1}>
          Asking about: {activeCollege?.name ?? 'General TNEA Help'}
        </Text>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        renderItem={({ item }) => <MessageBubble message={item} />}
        keyExtractor={(_, i) => i.toString()}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        contentContainerStyle={styles.messageList}
        ListEmptyComponent={
          <View style={styles.emptyChat}>
            <Text style={styles.emptyChatEmoji}>🎓</Text>
            <Text style={styles.emptyChatTitle}>College Buddy</Text>
            <Text style={styles.emptyChatSubtitle}>
              Ask me anything about TN engineering colleges, TNEA admissions, cutoffs, and more.
            </Text>
          </View>
        }
      />

      {isLoading && (
        <ActivityIndicator style={styles.loadingIndicator} color={Colors.primary} />
      )}

      {suggestions.length > 0 && !isLoading && (
        <SuggestionChips
          suggestions={suggestions}
          onSelect={(s) => setInputText(s)}
        />
      )}

      <View style={styles.inputRow}>
        <TextInput
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type your question…"
          placeholderTextColor={Colors.gray400}
          style={styles.input}
          multiline
          maxLength={1000}
          returnKeyType="default"
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={!inputText.trim() || isLoading}
          style={styles.sendButton}
          accessibilityLabel="Send message"
        >
          <Feather
            name="send"
            size={22}
            color={inputText.trim() && !isLoading ? Colors.primary : Colors.gray300}
          />
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>College Buddy · Powered by Claude AI</Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  contextBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  bannerIcon: {
    marginRight: 6,
  },
  bannerText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '500',
    flex: 1,
  },
  messageList: {
    padding: 16,
    flexGrow: 1,
  },
  emptyChat: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  emptyChatEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyChatTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  emptyChatSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingIndicator: {
    margin: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
    backgroundColor: Colors.white,
    gap: 10,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    backgroundColor: Colors.gray100,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  sendButton: {
    padding: 8,
    marginBottom: 2,
  },
  footer: {
    textAlign: 'center',
    fontSize: 11,
    color: Colors.textMuted,
    paddingBottom: 8,
    paddingTop: 2,
    backgroundColor: Colors.white,
  },
});
