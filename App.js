import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, 
  Alert, KeyboardAvoidingView, Platform, Image, Modal,
  ScrollView, StatusBar, Animated, Dimensions, Linking,
  ActivityIndicator
} from 'react-native';
import { createClient } from '@supabase/supabase-js';
import * as SMS from 'expo-sms';

// 🔗 اتصال به سرور Supabase خودمون
const SUPABASE_URL = 'https://coevmekdbyykinrmbvdm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvZXZtZWtkYnl5a2lucm1idmRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2Mjk4NjAsImV4cCI6MjA3NjIwNTg2MH0.1F1hexGrBIyhrP9-seKXWtDdO8Fq4vFqlA2y6WwC7OU';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 📞 اطلاعات پشتیبانی مستقیم
const SUPPORT_INFO = {
  name: "پشتیبانی چت روم",
  phone: "+989123456789",
  email: "support@chatroom.com", 
  telegram: "@chatroom_support",
  responseTime: "۲۴/۷"
};

export default function SuperChatApp() {
  // 🎯 حالت‌های اصلی
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('chats');
  const [showSupport, setShowSupport] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showGames, setShowGames] = useState(false);
  const [walletBalance, setWalletBalance] = useState(10000); // موجودی کیف پول

  // 🎯 ویژگی ۱: چت ریل‌تایم
  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: true });
    if (!error) setMessages(data || []);
  };

  // 🎯 ویژگی ۲: ارسال پیام
  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;
    setLoading(true);
    const { error } = await supabase
      .from('messages')
      .insert([{
        text: newMessage,
        user_id: user.id,
        user_email: user.email || 'کاربر مهمان',
        type: 'text'
      }]);
    if (!error) setNewMessage('');
    setLoading(false);
  };

  // 🎯 ویژگی ۳: ثبت‌نام با SMS
  const sendVerificationSMS = async () => {
    const isAvailable = await SMS.isAvailableAsync();
    if (isAvailable) {
      await SMS.sendSMSAsync(
        [phoneNumber],
        `کد تأیید چت روم: ${verificationCode}\nبرای ورود استفاده کنید.`
      );
      Alert.alert('پیامک ارسال شد', 'کد تأیید به شماره شما ارسال شد.');
      setUser({ id: 'guest', email: phoneNumber });
      setShowLogin(false);
    }
  };

  // 🎯 ویژگی ۴: پشتیبانی مستقیم
  const callSupport = () => Linking.openURL(`tel:${SUPPORT_INFO.phone}`);
  const messageSupport = () => Linking.openURL(`https://wa.me/${SUPPORT_INFO.phone}`);
  const emailSupport = () => Linking.openURL(`mailto:${SUPPORT_INFO.email}`);

  // 🎯 ویژگی ۵: سیستم پرداخت
  const handlePayment = (amount) => {
    setWalletBalance(prev => prev + amount);
    Alert.alert('پرداخت موفق', `${amount} تومان به کیف پول شما اضافه شد.`);
  };

  // 🎯 ویژگی ۶: بازی‌های ساده
  const games = [
    { id: 1, name: 'دوز', icon: '⭕', price: 1000 },
    { id: 2, name: 'پازل', icon: '🧩', price: 2000 },
    { id: 3, name: 'معما', icon: '🤔', price: 1500 },
  ];

  const playGame = (game) => {
    if (walletBalance >= game.price) {
      setWalletBalance(prev => prev - game.price);
      Alert.alert(`بازی ${game.name}`, `شروع بازی! ${game.price} تومان کسر شد.`);
    } else {
      Alert.alert('اعتبار ناکافی', 'موجودی کیف پول شما کافی نیست.');
    }
  };

  // 🎯 ویژگی ۷: Real-time updates
  useEffect(() => {
    fetchMessages();
    const subscription = supabase
      .channel('messages')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages' },
        () => fetchMessages()
      )
      .subscribe();
    return () => subscription.unsubscribe();
  }, []);

  // 🎯 استایل‌های داینامیک
  const styles = getStyles(darkMode);

  // صفحه لاگین/ثبت‌نام
  if (showLogin) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>📱 ثبت‌نام در چت روم</Text>
        
        <TextInput
          style={styles.input}
          placeholder="شماره موبایل"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
        />
        
        <TextInput
          style={styles.input}
          placeholder="کد تأیید"
          value={verificationCode}
          onChangeText={setVerificationCode}
        />
        
        <TouchableOpacity style={styles.loginButton} onPress={sendVerificationSMS}>
          <Text style={styles.loginButtonText}>ارسال کد تأیید</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={() => setShowLogin(false)}>
          <Text style={styles.secondaryButtonText}>بازگشت</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // صفحه اصلی
  return (
    <View style={styles.container}>
      <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} />
      
      {/* هدر */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setDarkMode(!darkMode)}>
          <Text style={styles.icon}>{darkMode ? '☀️' : '🌙'}</Text>
        </TouchableOpacity>
        
        <Text style={styles.title}>💬 چت روم</Text>
        
        <View style={styles.headerIcons}>
          <TouchableOpacity onPress={() => setShowSupport(true)}>
            <Text style={styles.icon}>🛟</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowGames(true)}>
            <Text style={styles.icon}>🎮</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* تب‌های اصلی */}
      <View style={styles.tabContainer}>
        {['chats', 'groups', 'payments', 'calls'].map(tab => (
          <TouchableOpacity 
            key={tab} 
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={styles.tabText}>
              {tab === 'chats' && '💬'}
              {tab === 'groups' && '👥'} 
              {tab === 'payments' && '💰'}
              {tab === 'calls' && '📞'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* محتوای تب‌ها */}
      <ScrollView style={styles.content}>
        {activeTab === 'chats' && (
          <>
            {messages.map(item => (
              <View key={item.id} style={[
                styles.messageContainer,
                item.user_id === user?.id ? styles.myMessage : styles.otherMessage
              ]}>
                <Text style={styles.messageUser}>{item.user_email}</Text>
                <Text style={styles.messageText}>{item.text}</Text>
                <Text style={styles.messageTime}>
                  {new Date(item.created_at).toLocaleTimeString('fa-IR')}
                </Text>
              </View>
            ))}
          </>
        )}

        {activeTab === 'groups' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>گروه‌ها و کانال‌ها</Text>
            {['گروه دوستان', 'کانال اخبار', 'گروه خانواده'].map(group => (
              <TouchableOpacity key={group} style={styles.groupItem}>
                <Text style={styles.groupText}>👥 {group}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {activeTab === 'payments' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>کیف پول</Text>
            <Text style={styles.balance}>موجودی: {walletBalance} تومان</Text>
            
            <Text style={styles.sectionTitle}>شارژ حساب</Text>
            {[5000, 10000, 20000, 50000].map(amount => (
              <TouchableOpacity 
                key={amount} 
                style={styles.paymentButton}
                onPress={() => handlePayment(amount)}
              >
                <Text style={styles.paymentText}>➕ {amount} تومان</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {activeTab === 'calls' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>تماس‌ها</Text>
            {[
              { name: 'علی', type: '📞 ورودی', time: '۱۰:۳۰' },
              { name: 'رضا', type: '📞 خروجی', time: '۰۹:۱۵' },
              { name: 'سارا', type: '📹 ویدیو', time: 'دیروز' }
            ].map(call => (
              <TouchableOpacity key={call.name} style={styles.callItem}>
                <Text style={styles.callText}>{call.type} {call.name}</Text>
                <Text style={styles.callTime}>{call.time}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* input ارسال پیام (فقط در تب چت) */}
      {activeTab === 'chats' && (
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="پیام خودت رو بنویس..."
            placeholderTextColor={darkMode ? '#888' : '#999'}
          />
          <TouchableOpacity style={styles.sendButton} onPress={sendMessage} disabled={loading}>
            <Text style={styles.sendButtonText}>{loading ? '...' : 'ارسال'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* دکمه لاگین اگر کاربر لاگین نکرده */}
      {!user && (
        <TouchableOpacity style={styles.floatingLogin} onPress={() => setShowLogin(true)}>
          <Text style={styles.floatingLoginText}>ورود / ثبت‌نام</Text>
        </TouchableOpacity>
      )}

      {/* مودال پشتیبانی */}
      <Modal visible={showSupport} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🛟 پشتیبانی چت روم</Text>
            <Text style={styles.modalText}>پاسخگویی ۲۴ ساعته</Text>
            
            <TouchableOpacity style={styles.supportOption} onPress={callSupport}>
              <Text style={styles.supportOptionText}>📞 تماس با پشتیبانی</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.supportOption} onPress={messageSupport}>
              <Text style={styles.supportOptionText}>💬 پیام به پشتیبانی</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.supportOption} onPress={emailSupport}>
              <Text style={styles.supportOptionText}>📧 ایمیل به پشتیبانی</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.closeButton} onPress={() => setShowSupport(false)}>
              <Text style={styles.closeButtonText}>بستن</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* مودال بازی‌ها */}
      <Modal visible={showGames} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🎮 بازی‌ها</Text>
            
            {games.map(game => (
              <TouchableOpacity 
                key={game.id} 
                style={styles.gameItem}
                onPress={() => playGame(game)}
              >
                <Text style={styles.gameText}>{game.icon} {game.name}</Text>
                <Text style={styles.gamePrice}>{game.price} تومان</Text>
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity style={styles.closeButton} onPress={() => setShowGames(false)}>
              <Text style={styles.closeButtonText}>بستن</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// 🎨 استایل‌های داینامیک
const getStyles = (darkMode) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkMode ? '#1a1a1a' : '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: darkMode ? '#2a2a2a' : '#007AFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  icon: {
    fontSize: 24,
    color: 'white',
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 15,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: darkMode ? '#2a2a2a' : 'white',
    borderBottomWidth: 1,
    borderBottomColor: darkMode ? '#444' : '#ddd',
  },
  tab: {
    flex: 1,
    padding: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 20,
    color: darkMode ? 'white' : 'black',
  },
  content: {
    flex: 1,
    padding: 10,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: darkMode ? 'white' : 'black',
    marginBottom: 10,
  },
  balance: {
    fontSize: 16,
    color: '#28a745',
    marginBottom: 15,
  },
  messageContainer: {
    padding: 12,
    borderRadius: 15,
    marginVertical: 5,
    maxWidth: '80%',
  },
  myMessage: {
    backgroundColor: darkMode ? '#007AFF' : '#007AFF',
    alignSelf: 'flex-end',
  },
  otherMessage: {
    backgroundColor: darkMode ? '#333' : 'white',
    alignSelf: 'flex-start',
  },
  messageUser: {
    fontSize: 12,
    color: darkMode ? '#ccc' : '#666',
    marginBottom: 5,
  },
  messageText: {
    fontSize: 16,
    color: darkMode ? 'white' : 'black',
  },
  messageTime: {
    fontSize: 10,
    color: darkMode ? '#999' : '#999',
    marginTop: 5,
    textAlign: 'right',
  },
  groupItem: {
    backgroundColor: darkMode ? '#333' : 'white',
    padding: 15,
    borderRadius: 10,
    marginVertical: 5,
  },
  groupText: {
    color: darkMode ? 'white' : 'black',
    fontSize: 16,
  },
  paymentButton: {
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 10,
    marginVertical: 5,
  },
  paymentText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  callItem: {
    backgroundColor: darkMode ? '#333' : 'white',
    padding: 15,
    borderRadius: 10,
    marginVertical: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  callText: {
    color: darkMode ? 'white' : 'black',
    fontSize: 16,
  },
  callTime: {
    color: darkMode ? '#999' : '#666',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: darkMode ? '#2a2a2a' : 'white',
    borderTopWidth: 1,
    borderTopColor: darkMode ? '#444' : '#ddd',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: darkMode ? '#444' : '#ddd',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    backgroundColor: darkMode ? '#333' : '#f9f9f9',
    color: darkMode ? 'white' : 'black',
  },
  sendButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 25,
    justifyContent: 'center',
  },
  sendButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: darkMode ? '#444' : '#ddd',
    borderRadius: 10,
    padding: 15,
    margin: 10,
    backgroundColor: darkMode ? '#333' : 'white',
    color: darkMode ? 'white' : 'black',
  },
  loginButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    margin: 10,
  },
  loginButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#6c757d',
    padding: 15,
    borderRadius: 10,
    margin: 10,
  },
  secondaryButtonText: {
    color: 'white',
    textAlign: 'center',
  },
  floatingLogin: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 25,
  },
  floatingLoginText: {
    color: 'white',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: darkMode ? '#2a2a2a' : 'white',
    padding: 20,
    borderRadius: 15,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: darkMode ? 'white' : 'black',
    textAlign: 'center',
    marginBottom: 10,
  },
  modalText: {
    color: darkMode ? '#ccc' : '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  supportOption: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    marginVertical: 5,
  },
  supportOptionText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  gameItem: {
    backgroundColor: darkMode ? '#333' : '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    marginVertical: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gameText: {
    color: darkMode ? 'white' : 'black',
    fontSize: 16,
  },
  gamePrice: {
    color: '#28a745',
    fontWeight: 'bold',
  },
  closeButton: {
    backgroundColor: '#dc3545',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  closeButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});
