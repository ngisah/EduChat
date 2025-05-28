export const authService = {
  login: async (email, password) => {
    console.log('Mock login attempt:', email);
    // ... (rest of login logic from original App.js)
    if (email === 'student@educhat.app' && password === 'password') {
      return Promise.resolve({
        token: 'fake-student-token',
        user: { id: 'student1', fullName: 'Sarah Student', email: 'student@educhat.app', role: 'student', profilePictureUrl: 'https://placehold.co/100x100/E0E0E0/757575?text=S' },
      });
    }
    if (email === 'teacher@educhat.app' && password === 'password') {
      return Promise.resolve({
        token: 'fake-teacher-token',
        user: { id: 'teacher1', fullName: 'Mr. David Lee', email: 'teacher@educhat.app', role: 'educator', profilePictureUrl: 'https://placehold.co/100x100/C0C0C0/505050?text=D' },
      });
    }
    return Promise.reject(new Error('Invalid credentials'));
  },
  register: async (fullName, email, password, role) => {
    console.log('Mock register attempt:', fullName, email, role);
    
    // ... (rest of register logic)
    return Promise.resolve({
      user: { id: 'newuser123', fullName, email, role, profilePictureUrl: `https://placehold.co/100x100/D0D0D0/606060?text=${fullName.charAt(0)}` },
      token: 'fake-new-user-token',
    });
  },
  logout: async () => {
    console.log('Mock logout');
    // ... (rest of logout logic)
    return Promise.resolve();
  },
};