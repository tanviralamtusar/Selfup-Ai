import { SupabaseClient } from '@supabase/supabase-js'
import { calculateTaskXp, calculateHpPenalty } from './task-economy.service'

/**
 * Task Injection Service (§6)
 * 
 * Deduplication-aware injection from Fitness, Skills, and Style modules.
 * When a module creates/updates a plan, it injects tasks into Dailies/Habits/Todos.
 * When a plan ends, it cleans up injected tasks.
 */

type TaskType = 'daily' | 'habit' | 'todo'
type Category = 'general' | 'fitness' | 'skills' | 'style' | 'system'
type Source = 'user' | 'ai' | 'fitness' | 'skills' | 'style' | 'quest'

interface InjectedDailyData {
  title: string
  description?: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  category: Category
  source: Source
  repeat_type?: 'daily' | 'weekly'
  repeat_days?: string[]
  scheduled_time?: string
  expires_on?: string
  subtasks?: Array<{ title: string; is_completed: boolean }>
}

interface InjectedHabitData {
  title: string
  description?: string
  category: Category
  source: Source
  reset_type?: 'daily' | 'weekly' | 'monthly'
  is_indefinite?: boolean
  end_date?: string
}

interface InjectedTodoData {
  title: string
  description?: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  category: Category
  source: Source
  due_date?: string
  subtasks?: Array<{ title: string; is_completed: boolean }>
}

export class TaskInjectionService {
  private db: SupabaseClient

  constructor(db: SupabaseClient) {
    this.db = db
  }

  // ── Core Deduplication Logic ──

  /**
   * Find an existing active task by title + category + source for dedup
   */
  private async findExistingTask(
    userId: string,
    table: string,
    title: string,
    category: string,
    source: string
  ): Promise<any | null> {
    const { data } = await this.db
      .from(table)
      .select('*')
      .eq('user_id', userId)
      .eq('title', title)
      .eq('category', category)
      .eq('source', source)
      .maybeSingle()

    return data
  }

  // ── Daily Injection ──

  /**
   * Inject a daily task — deduplication-aware
   * If a daily with the same title+category+source exists, updates it instead
   */
  async injectDaily(
    userId: string,
    data: InjectedDailyData
  ): Promise<{ injected: boolean; updated: boolean; daily: any }> {
    const existing = await this.findExistingTask(
      userId, 'dailies', data.title, data.category, data.source
    )

    const { xp_reward, xp_penalty } = calculateTaskXp('daily', data.priority)

    if (existing) {
      // Update existing
      const { data: updated, error } = await this.db
        .from('dailies')
        .update({
          description: data.description || existing.description,
          priority: data.priority,
          repeat_type: data.repeat_type || existing.repeat_type,
          repeat_days: data.repeat_days || existing.repeat_days,
          scheduled_time: data.scheduled_time || existing.scheduled_time,
          expires_on: data.expires_on || existing.expires_on,
          subtasks: data.subtasks || existing.subtasks,
          xp_reward,
          xp_penalty,
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw new Error(`Daily update failed: ${error.message}`)
      return { injected: false, updated: true, daily: updated }
    }

    // Insert new
    const { data: created, error } = await this.db
      .from('dailies')
      .insert({
        user_id: userId,
        title: data.title,
        description: data.description || null,
        priority: data.priority,
        category: data.category,
        source: data.source,
        repeat_type: data.repeat_type || 'daily',
        repeat_days: data.repeat_days || null,
        scheduled_time: data.scheduled_time || null,
        expires_on: data.expires_on || null,
        subtasks: data.subtasks || [],
        xp_reward,
        xp_penalty,
      })
      .select()
      .single()

    if (error) throw new Error(`Daily inject failed: ${error.message}`)
    return { injected: true, updated: false, daily: created }
  }

  // ── Habit Injection ──

  /**
   * Inject a habit — deduplication-aware
   */
  async injectHabit(
    userId: string,
    data: InjectedHabitData
  ): Promise<{ injected: boolean; updated: boolean; habit: any }> {
    const existing = await this.findExistingTask(
      userId, 'habits', data.title, data.category, data.source
    )

    const resetType = data.reset_type || 'daily'
    const hp_penalty = calculateHpPenalty(resetType)

    if (existing) {
      const { data: updated, error } = await this.db
        .from('habits')
        .update({
          description: data.description || existing.description,
          reset_type: resetType,
          is_indefinite: data.is_indefinite ?? existing.is_indefinite,
          end_date: data.end_date || existing.end_date,
          hp_penalty,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw new Error(`Habit update failed: ${error.message}`)
      return { injected: false, updated: true, habit: updated }
    }

    const { data: created, error } = await this.db
      .from('habits')
      .insert({
        user_id: userId,
        title: data.title,
        description: data.description || null,
        category: data.category,
        source: data.source,
        reset_type: resetType,
        is_indefinite: data.is_indefinite ?? true,
        end_date: data.end_date || null,
        hp_penalty,
        xp_reward: 10,
      })
      .select()
      .single()

    if (error) throw new Error(`Habit inject failed: ${error.message}`)
    return { injected: true, updated: false, habit: created }
  }

  // ── Todo Injection ──

  /**
   * Inject a todo — deduplication-aware
   */
  async injectTodo(
    userId: string,
    data: InjectedTodoData
  ): Promise<{ injected: boolean; updated: boolean; todo: any }> {
    const existing = await this.findExistingTask(
      userId, 'todos', data.title, data.category, data.source
    )

    const { xp_reward, xp_penalty } = calculateTaskXp('todo', data.priority, !!data.due_date)

    if (existing) {
      const { data: updated, error } = await this.db
        .from('todos')
        .update({
          description: data.description || existing.description,
          priority: data.priority,
          due_date: data.due_date || existing.due_date,
          subtasks: data.subtasks || existing.subtasks,
          xp_reward,
          xp_penalty,
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw new Error(`Todo update failed: ${error.message}`)
      return { injected: false, updated: true, todo: updated }
    }

    const { data: created, error } = await this.db
      .from('todos')
      .insert({
        user_id: userId,
        title: data.title,
        description: data.description || null,
        priority: data.priority,
        category: data.category,
        source: data.source,
        due_date: data.due_date || null,
        subtasks: data.subtasks || [],
        xp_reward,
        xp_penalty,
      })
      .select()
      .single()

    if (error) throw new Error(`Todo inject failed: ${error.message}`)
    return { injected: true, updated: false, todo: created }
  }

  // ── Module-Specific Injection Methods ──

  /**
   * Fitness → Inject workout plan as daily
   */
  async injectFitnessDaily(
    userId: string,
    planData: { title: string; description?: string; days?: string[]; expires_on?: string }
  ) {
    return this.injectDaily(userId, {
      title: planData.title,
      description: planData.description,
      priority: 'high',
      category: 'fitness',
      source: 'fitness',
      repeat_type: planData.days ? 'weekly' : 'daily',
      repeat_days: planData.days,
      expires_on: planData.expires_on,
    })
  }

  /**
   * Fitness → Inject ongoing routine as habit
   */
  async injectFitnessHabit(
    userId: string,
    habitData: { title: string; description?: string; reset_type?: 'daily' | 'weekly' | 'monthly' }
  ) {
    return this.injectHabit(userId, {
      title: habitData.title,
      description: habitData.description,
      category: 'fitness',
      source: 'fitness',
      reset_type: habitData.reset_type || 'daily',
    })
  }

  /**
   * Skills → Inject practice session as daily
   */
  async injectSkillsDaily(
    userId: string,
    roadmapData: { title: string; description?: string }
  ) {
    return this.injectDaily(userId, {
      title: roadmapData.title,
      description: roadmapData.description,
      priority: 'medium',
      category: 'skills',
      source: 'skills',
    })
  }

  /**
   * Skills → Inject milestone as todo
   */
  async injectSkillsTodo(
    userId: string,
    milestoneData: { title: string; description?: string; due_date?: string }
  ) {
    return this.injectTodo(userId, {
      title: milestoneData.title,
      description: milestoneData.description,
      priority: 'medium',
      category: 'skills',
      source: 'skills',
      due_date: milestoneData.due_date,
    })
  }

  // ── Cleanup ──

  /**
   * Cancel all injected tasks from a specific source when a plan ends
   */
  async cancelPlanTasks(
    userId: string,
    source: Source,
    category: Category
  ): Promise<{ dailies_removed: number; habits_removed: number; todos_removed: number }> {
    const [dailiesResult, habitsResult, todosResult] = await Promise.all([
      this.db.from('dailies')
        .delete()
        .eq('user_id', userId)
        .eq('source', source)
        .eq('category', category)
        .eq('is_completed', false),

      this.db.from('habits')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('source', source)
        .eq('category', category),

      this.db.from('todos')
        .delete()
        .eq('user_id', userId)
        .eq('source', source)
        .eq('category', category)
        .eq('is_completed', false),
    ])

    return {
      dailies_removed: dailiesResult.count || 0,
      habits_removed: habitsResult.count || 0,
      todos_removed: todosResult.count || 0,
    }
  }
}
