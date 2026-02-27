'use client';

import { useState, useEffect } from 'react';
import { AppState, User, Class, Video, Membership, Reservation, Attendance, VideoPurchase, DigitalRoutinePurchase, NutritionalPlan, NutritionalBlog, NutritionalPlanPurchase } from '@/types';

const STORAGE_KEY = 'roger-box-app-state';

// Default classes for the week
const defaultClasses: Class[] = [
  // Monday
  { id: 'mon-6am', name: 'HIIT Morning', time: '06:00', dayOfWeek: 1, duration: 45, intensity: 'High', capacity: 20, instructor: 'Roger' },
  { id: 'mon-7pm', name: 'HIIT Evening', time: '19:00', dayOfWeek: 1, duration: 45, intensity: 'High', capacity: 20, instructor: 'Roger' },
  
  // Tuesday
  { id: 'tue-6am', name: 'HIIT Morning', time: '06:00', dayOfWeek: 2, duration: 45, intensity: 'High', capacity: 20, instructor: 'Roger' },
  { id: 'tue-7pm', name: 'HIIT Evening', time: '19:00', dayOfWeek: 2, duration: 45, intensity: 'High', capacity: 20, instructor: 'Roger' },
  
  // Wednesday
  { id: 'wed-6am', name: 'HIIT Morning', time: '06:00', dayOfWeek: 3, duration: 45, intensity: 'High', capacity: 20, instructor: 'Roger' },
  { id: 'wed-7pm', name: 'HIIT Evening', time: '19:00', dayOfWeek: 3, duration: 45, intensity: 'High', capacity: 20, instructor: 'Roger' },
  
  // Thursday
  { id: 'thu-6am', name: 'HIIT Morning', time: '06:00', dayOfWeek: 4, duration: 45, intensity: 'High', capacity: 20, instructor: 'Roger' },
  { id: 'thu-7pm', name: 'HIIT Evening', time: '19:00', dayOfWeek: 4, duration: 45, intensity: 'High', capacity: 20, instructor: 'Roger' },
  
  // Friday
  { id: 'fri-6am', name: 'HIIT Morning', time: '06:00', dayOfWeek: 5, duration: 45, intensity: 'High', capacity: 20, instructor: 'Roger' },
  { id: 'fri-7pm', name: 'HIIT Evening', time: '19:00', dayOfWeek: 5, duration: 45, intensity: 'High', capacity: 20, instructor: 'Roger' },
  
  // Saturday
  { id: 'sat-8am', name: 'HIIT Weekend', time: '08:00', dayOfWeek: 6, duration: 60, intensity: 'Medium', capacity: 25, instructor: 'Roger' },
  { id: 'sat-10am', name: 'HIIT Weekend', time: '10:00', dayOfWeek: 6, duration: 60, intensity: 'Medium', capacity: 25, instructor: 'Roger' },
  
  // Sunday
  { id: 'sun-8am', name: 'HIIT Weekend', time: '08:00', dayOfWeek: 0, duration: 60, intensity: 'Medium', capacity: 25, instructor: 'Roger' },
  { id: 'sun-10am', name: 'HIIT Weekend', time: '10:00', dayOfWeek: 0, duration: 60, intensity: 'Medium', capacity: 25, instructor: 'Roger' },
];

// Default videos from YouTube playlist
const defaultVideos: Video[] = [
  {
    id: 'video-1',
    title: 'HIIT Cardio Intenso',
    description: 'Entrenamiento HIIT de alta intensidad para quemar grasa y ganar resistencia',
    thumbnailUrl: 'https://img.youtube.com/vi/wkrDWwujIMY/maxresdefault.jpg',
    videoUrl: 'https://www.youtube.com/embed/wkrDWwujIMY',
    level: 'Intermediate',
    duration: 30,
    price: 7900,
    purchaseCount: 0,
    createdAt: new Date(),
  },
  {
    id: 'video-2',
    title: 'Fuerza y Resistencia',
    description: 'Desarrolla fuerza muscular y resistencia con ejercicios funcionales',
    thumbnailUrl: 'https://img.youtube.com/vi/wkrDWwujIMY/maxresdefault.jpg',
    videoUrl: 'https://www.youtube.com/embed/wkrDWwujIMY',
    level: 'Advanced',
    duration: 45,
    price: 7900,
    purchaseCount: 0,
    createdAt: new Date(),
  },
  {
    id: 'video-3',
    title: 'HIIT para Principiantes',
    description: 'Introducción perfecta al entrenamiento HIIT con ejercicios básicos',
    thumbnailUrl: 'https://img.youtube.com/vi/wkrDWwujIMY/maxresdefault.jpg',
    videoUrl: 'https://www.youtube.com/embed/wkrDWwujIMY',
    level: 'Beginner',
    duration: 25,
    price: 7900,
    purchaseCount: 0,
    createdAt: new Date(),
  },
  {
    id: 'video-4',
    title: 'Entrenamiento Explosivo',
    description: 'Ejercicios explosivos para desarrollar potencia y velocidad',
    thumbnailUrl: 'https://img.youtube.com/vi/wkrDWwujIMY/maxresdefault.jpg',
    videoUrl: 'https://www.youtube.com/embed/wkrDWwujIMY',
    level: 'Advanced',
    duration: 35,
    price: 7900,
    purchaseCount: 0,
    createdAt: new Date(),
  },
  {
    id: 'video-5',
    title: 'Cardio Quema Grasa',
    description: 'Sesión intensa de cardio para maximizar la quema de grasa',
    thumbnailUrl: 'https://img.youtube.com/vi/wkrDWwujIMY/maxresdefault.jpg',
    videoUrl: 'https://www.youtube.com/embed/wkrDWwujIMY',
    level: 'Intermediate',
    duration: 40,
    price: 7900,
    purchaseCount: 0,
    createdAt: new Date(),
  },
];

// Default nutritional plans
const defaultNutritionalPlans: NutritionalPlan[] = [
  {
    id: 'plan-1',
    title: 'Plan Definitivo para Bajar de Peso',
    description: 'Plan nutricional de 30 días diseñado para pérdida de peso saludable y sostenible',
    duration: 30,
    price: 89000,
    level: 'Beginner',
    category: 'weight_loss',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    thumbnailUrl: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400',
    menu: [
      {
        day: 1,
        meals: [
          {
            name: 'Desayuno',
            time: '08:00',
            foods: [
              { name: 'Avena con frutas', quantity: '1 taza', calories: 300, protein: 12, carbs: 45, fat: 8 },
              { name: 'Huevo cocido', quantity: '1 unidad', calories: 70, protein: 6, carbs: 0, fat: 5 }
            ],
            calories: 370
          },
          {
            name: 'Almuerzo',
            time: '13:00',
            foods: [
              { name: 'Pechuga de pollo', quantity: '150g', calories: 250, protein: 46, carbs: 0, fat: 5 },
              { name: 'Arroz integral', quantity: '1/2 taza', calories: 110, protein: 2, carbs: 22, fat: 1 },
              { name: 'Ensalada verde', quantity: '1 taza', calories: 20, protein: 1, carbs: 4, fat: 0 }
            ],
            calories: 380
          },
          {
            name: 'Cena',
            time: '19:00',
            foods: [
              { name: 'Salmón', quantity: '120g', calories: 200, protein: 22, carbs: 0, fat: 12 },
              { name: 'Vegetales al vapor', quantity: '1 taza', calories: 50, protein: 2, carbs: 10, fat: 0 }
            ],
            calories: 250
          }
        ],
        totalCalories: 1000,
        macros: { protein: 89, carbs: 81, fat: 31 }
      }
    ],
    nutritionalInfo: {
      totalCalories: 1200,
      protein: 100,
      carbs: 80,
      fat: 35,
      fiber: 25,
      sugar: 30,
      sodium: 1500
    },
    purchaseCount: 0,
    createdAt: new Date(),
  },
  {
    id: 'plan-2',
    title: 'Plan de Ganancia Muscular',
    description: 'Plan nutricional de 21 días para ganar masa muscular de forma efectiva',
    duration: 21,
    price: 79000,
    level: 'Intermediate',
    category: 'muscle_gain',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    thumbnailUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400',
    menu: [],
    nutritionalInfo: {
      totalCalories: 2500,
      protein: 150,
      carbs: 200,
      fat: 80,
      fiber: 30,
      sugar: 50,
      sodium: 2000
    },
    purchaseCount: 0,
    createdAt: new Date(),
  },
  {
    id: 'plan-3',
    title: 'Plan Detox de 7 Días',
    description: 'Plan de desintoxicación para limpiar el organismo y resetear hábitos',
    duration: 7,
    price: 49000,
    level: 'Beginner',
    category: 'detox',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    thumbnailUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400',
    menu: [],
    nutritionalInfo: {
      totalCalories: 1000,
      protein: 60,
      carbs: 120,
      fat: 25,
      fiber: 35,
      sugar: 20,
      sodium: 800
    },
    purchaseCount: 0,
    createdAt: new Date(),
  }
];

// Default blogs
const defaultBlogs: NutritionalBlog[] = [];

const defaultState: AppState = {
  currentUser: null,
  users: [
    {
      id: 'demo-user-1',
      name: 'Usuario Demo',
      weight: 70,
      height: 170,
      gender: 'male',
      goals: ['bajar de peso', 'tonificar'],
      targetWeight: 65,
      createdAt: new Date(),
      membership: {
        id: 'membership-demo-1',
        userId: 'demo-user-1',
        isActive: true,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        price: 135000,
      },
      reservations: [],
      attendances: [],
      videoPurchases: [],
      digitalRoutinePurchases: [],
      nutritionalPlanPurchases: [],
    }
  ],
  classes: defaultClasses,
  videos: defaultVideos,
  nutritionalPlans: defaultNutritionalPlans,
  nutritionalBlogs: defaultBlogs,
  isAdminMode: false,
};

class AppStore {
  private state: AppState;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): AppState {
    if (typeof window === 'undefined') return defaultState;
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        parsed.users = parsed.users.map((user: User) => ({
          ...user,
          createdAt: new Date(user.createdAt),
          membership: user.membership ? {
            ...user.membership,
            startDate: new Date(user.membership.startDate),
            endDate: user.membership.endDate ? new Date(user.membership.endDate) : undefined,
          } : undefined,
          reservations: user.reservations ? user.reservations.map((r: Reservation) => ({
            ...r,
            classDate: new Date(r.classDate),
            createdAt: new Date(r.createdAt),
          })) : [],
          attendances: user.attendances ? user.attendances.map((a: Attendance) => ({
            ...a,
            classDate: new Date(a.classDate),
            confirmedAt: new Date(a.confirmedAt),
          })) : [],
          videoPurchases: user.videoPurchases ? user.videoPurchases.map((vp: VideoPurchase) => ({
            ...vp,
            purchasedAt: new Date(vp.purchasedAt),
          })) : [],
          digitalRoutinePurchases: user.digitalRoutinePurchases ? user.digitalRoutinePurchases.map((drp: DigitalRoutinePurchase) => ({
            ...drp,
            purchasedAt: new Date(drp.purchasedAt),
          })) : [],
        }));
        parsed.videos = parsed.videos.map((video: Video) => ({
          ...video,
          createdAt: new Date(video.createdAt),
        }));
        return parsed;
      }
    } catch (error) {
      console.error('Error loading state from localStorage:', error);
    }
    
    return defaultState;
  }

  private saveState() {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (error) {
      console.error('Error saving state to localStorage:', error);
    }
  }

  private notify() {
    this.listeners.forEach(listener => listener());
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getState() {
    return this.state;
  }

  // User management
  createUser(name: string, weight: number, height: number, gender: 'male' | 'female' | 'other', goals: string[], targetWeight?: number): User {
    const user: User = {
      id: `user-${Date.now()}`,
      name,
      weight,
      height,
      gender,
      goals,
      targetWeight,
      reservations: [],
      attendances: [],
      videoPurchases: [],
      digitalRoutinePurchases: [],
      nutritionalPlanPurchases: [],
      createdAt: new Date(),
    };
    
    this.state.users.push(user);
    this.state.currentUser = user;
    this.saveState();
    this.notify();
    return user;
  }

  selectUser(userId: string) {
    if (userId === '') {
      // Logout - clear current user
      this.state.currentUser = null;
      this.saveState();
      this.notify();
      return;
    }
    
    const user = this.state.users.find(u => u.id === userId);
    if (user) {
      this.state.currentUser = user;
      this.saveState();
      this.notify();
    }
  }

  // Membership management
  activateMembership(userId: string) {
    const user = this.state.users.find(u => u.id === userId);
    if (user) {
      const membership: Membership = {
        id: `membership-${Date.now()}`,
        userId,
        isActive: true,
        startDate: new Date(),
        price: 135000,
      };
      
      user.membership = membership;
      this.saveState();
      this.notify();
    }
  }

  // Reservation management
  createReservation(userId: string, classId: string, classDate: Date) {
    const user = this.state.users.find(u => u.id === userId);
    if (!user || !user.membership?.isActive) return false;

    // Check if user already has a reservation for this day
    const sameDayReservation = user.reservations.find(r => 
      r.status === 'active' && 
      r.classDate.toDateString() === classDate.toDateString()
    );
    
    if (sameDayReservation) return false;

    // Check if reservation is within 2 days
    const now = new Date();
    const daysDiff = Math.ceil((classDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > 2) return false;

    // Check class capacity
    const classData = this.state.classes.find(c => c.id === classId);
    if (!classData) return false;

    const currentReservations = this.state.users
      .flatMap(u => u.reservations)
      .filter(r => r.classId === classId && r.status === 'active' && r.classDate.toDateString() === classDate.toDateString());
    
    if (currentReservations.length >= classData.capacity) return false;

    const reservation: Reservation = {
      id: `reservation-${Date.now()}`,
      userId,
      classId,
      classDate,
      createdAt: new Date(),
      status: 'active',
    };

    user.reservations.push(reservation);
    this.saveState();
    this.notify();
    return true;
  }

  cancelReservation(reservationId: string) {
    const user = this.state.users.find(u => u.reservations.some(r => r.id === reservationId));
    if (user) {
      const reservation = user.reservations.find(r => r.id === reservationId);
      if (reservation) {
        reservation.status = 'cancelled';
        this.saveState();
        this.notify();
      }
    }
  }

  // Attendance management
  confirmAttendance(userId: string, classId: string, classDate: Date) {
    const user = this.state.users.find(u => u.id === userId);
    if (!user) return false;

    // Check if user has an active reservation for this class
    const reservation = user.reservations.find(r => 
      r.classId === classId && 
      r.status === 'active' && 
      r.classDate.toDateString() === classDate.toDateString()
    );

    if (!reservation) return false;

    // Check if already attended
    const existingAttendance = user.attendances.find(a => 
      a.classId === classId && 
      a.classDate.toDateString() === classDate.toDateString()
    );

    if (existingAttendance) return false;

    const classData = this.state.classes.find(c => c.id === classId);
    if (!classData) return false;

    // Calculate calories based on intensity, duration, and weight
    const caloriesBurned = this.calculateCalories(classData.intensity, classData.duration, user.weight);

    const attendance: Attendance = {
      id: `attendance-${Date.now()}`,
      userId,
      classId,
      classDate,
      caloriesBurned,
      confirmedAt: new Date(),
    };

    user.attendances.push(attendance);
    this.saveState();
    this.notify();
    return { success: true, caloriesBurned };
  }

  private calculateCalories(intensity: 'Low' | 'Medium' | 'High', duration: number, weight: number): number {
    const baseCaloriesPerMinute = {
      'Low': 3,
      'Medium': 5,
      'High': 7,
    };
    
    return Math.round(baseCaloriesPerMinute[intensity] * duration * (weight / 70)); // 70kg as reference
  }

  // Video management
  purchaseVideo(userId: string, videoId: string) {
    const user = this.state.users.find(u => u.id === userId);
    const video = this.state.videos.find(v => v.id === videoId);
    
    if (!user || !video) return false;

    // Check if already purchased
    const existingPurchase = user.videoPurchases.find(vp => vp.videoId === videoId);
    if (existingPurchase) return false;

    const purchase: VideoPurchase = {
      id: `video-purchase-${Date.now()}`,
      userId,
      videoId,
      purchasedAt: new Date(),
      price: video.price,
    };

    user.videoPurchases.push(purchase);
    video.purchaseCount++;
    this.saveState();
    this.notify();
    return true;
  }

  purchaseDigitalRoutine(userId: string) {
    const user = this.state.users.find(u => u.id === userId);
    if (!user) return false;

    const purchase: DigitalRoutinePurchase = {
      id: `digital-routine-${Date.now()}`,
      userId,
      purchasedAt: new Date(),
      price: 5000, // COP 5,000 for digital routine
    };

    user.digitalRoutinePurchases.push(purchase);
    this.saveState();
    this.notify();
    return true;
  }

  // Nutritional plan management
  purchaseNutritionalPlan(planId: string) {
    const currentUser = this.state.currentUser;
    if (!currentUser) return false;

    const plan = this.state.nutritionalPlans.find(p => p.id === planId);
    if (!plan) return false;

    // Check if already purchased
    const existingPurchase = currentUser.nutritionalPlanPurchases.find(np => np.planId === planId);
    if (existingPurchase) return false;

    const purchase: NutritionalPlanPurchase = {
      id: `nutritional-plan-${Date.now()}`,
      userId: currentUser.id,
      planId,
      purchasedAt: new Date(),
      price: plan.price,
    };

    currentUser.nutritionalPlanPurchases.push(purchase);
    
    // Update purchase count
    plan.purchaseCount += 1;
    
    this.saveState();
    this.notify();
    return true;
  }

  // Admin functions
  addVideo(video: Omit<Video, 'id' | 'purchaseCount' | 'createdAt'>) {
    const newVideo: Video = {
      ...video,
      id: `video-${Date.now()}`,
      purchaseCount: 0,
      createdAt: new Date(),
    };
    
    this.state.videos.push(newVideo);
    this.saveState();
    this.notify();
    return newVideo;
  }

  getAdminStats(): any {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const activeMemberships = this.state.users.filter(u => u.membership?.isActive).length;
    
    const weeklyReservations = this.state.users
      .flatMap(u => u.reservations)
      .filter(r => r.createdAt >= weekStart && r.createdAt <= weekEnd).length;
    
    const weeklyAttendances = this.state.users
      .flatMap(u => u.attendances)
      .filter(a => a.confirmedAt >= weekStart && a.confirmedAt <= weekEnd).length;

    return {
      totalUsers: this.state.users.length,
      activeMemberships,
      weeklyReservations,
      weeklyAttendances,
    };
  }

  getClassAttendances(classDate: Date): any[] {
    const classAttendances: any[] = [];
    
    this.state.classes.forEach(classData => {
      const attendances = this.state.users
        .flatMap(u => u.attendances)
        .filter(a => a.classId === classData.id && a.classDate.toDateString() === classDate.toDateString());
      
      const attendees = attendances.map(a => {
        const user = this.state.users.find(u => u.id === a.userId);
        return user?.name || 'Unknown';
      });

      classAttendances.push({
        classId: classData.id,
        className: classData.name,
        classTime: classData.time,
        classDate,
        totalCapacity: classData.capacity,
        attendedCount: attendances.length,
        attendees,
      });
    });

    return classAttendances;
  }

  toggleAdminMode() {
    this.state.isAdminMode = !this.state.isAdminMode;
    this.saveState();
    this.notify();
  }
}

export const appStore = new AppStore();

// React hook for using the store
export const useStore = () => {
  const [state, setState] = useState(appStore.getState());
  
  useEffect(() => {
    const unsubscribe = appStore.subscribe(() => {
      setState(appStore.getState());
    });
    
    return () => {
      unsubscribe();
    };
  }, []);
  
  return {
    ...state,
    // Store methods
    createUser: appStore.createUser.bind(appStore),
    selectUser: appStore.selectUser.bind(appStore),
    activateMembership: appStore.activateMembership.bind(appStore),
    createReservation: appStore.createReservation.bind(appStore),
    cancelReservation: appStore.cancelReservation.bind(appStore),
    confirmAttendance: appStore.confirmAttendance.bind(appStore),
    purchaseVideo: appStore.purchaseVideo.bind(appStore),
    purchaseDigitalRoutine: appStore.purchaseDigitalRoutine.bind(appStore),
    purchaseNutritionalPlan: appStore.purchaseNutritionalPlan.bind(appStore),
    addVideo: appStore.addVideo.bind(appStore),
    getAdminStats: appStore.getAdminStats.bind(appStore),
    getClassAttendances: appStore.getClassAttendances.bind(appStore),
    toggleAdminMode: appStore.toggleAdminMode.bind(appStore),
  };
};
