/// <reference types="jest" />

import { actions } from './action'
import { IEngine, SystemFn } from '@dcl/sdk/ecs'
import { priority } from './priority'

// Mock action implementation for testing
class MockAction implements actions.IAction {
  onStartCalled = false
  updateCalled = false
  updateCount = 0
  updateDtValue = 0
  onFinishCalled = false
  hasFinished = false

  onStart(): void {
    this.onStartCalled = true
  }

  update(dt: number): void {
    this.updateCalled = true
    this.updateCount++
    this.updateDtValue = dt
  }

  onFinish(): void {
    this.onFinishCalled = true
  }
}

// Mock engine for testing
const mockEngine: IEngine = {
  addSystem: jest.fn(),
  removeSystem: jest.fn(),
  // Add any other required properties/methods
} as any

describe('actions namespace', () => {
  describe('MockAction', () => {
    it('should implement IAction interface correctly', () => {
      const action = new MockAction()
      
      expect(action.onStartCalled).toBe(false)
      expect(action.updateCalled).toBe(false)
      expect(action.onFinishCalled).toBe(false)
      expect(action.hasFinished).toBe(false)
      
      action.onStart()
      expect(action.onStartCalled).toBe(true)
      
      action.update(0.1)
      expect(action.updateCalled).toBe(true)
      expect(action.updateCount).toBe(1)
      expect(action.updateDtValue).toBe(0.1)
      
      action.onFinish()
      expect(action.onFinishCalled).toBe(true)
    })
  })

  describe('SequenceNode', () => {
    it('should handle action execution', () => {
      const node = new actions.SequenceNode()
      const mockAction = new MockAction()
      node.action = mockAction

      node.onStart()
      expect(mockAction.onStartCalled).toBe(true)

      node.update(0.1)
      expect(mockAction.updateCalled).toBe(true)

      node.onFinish()
      expect(mockAction.onFinishCalled).toBe(true)

      expect(node.hasFinish()).toBe(false) // Since action hasFinished is false initially
    })

    it('should return true for hasFinish when no action is set', () => {
      const node = new actions.SequenceNode()
      expect(node.hasFinish()).toBe(true)
    })

    it('should link nodes properly', () => {
      const node1 = new actions.SequenceNode()
      const node2 = new actions.SequenceNode()

      const result = node1.then(node2)
      expect(node1.next).toBe(node2)
      expect(result).toBe(node2)
    })

    it('should return itself for getSequence', () => {
      const node = new actions.SequenceNode()
      expect(node.getSequence()).toBe(node)
    })
  })

  describe('SequenceBuilder', () => {
    it('should build a sequence with then', () => {
      const builder = new actions.SequenceBuilder()
      const mockAction = new MockAction()
      
      const result = builder.then(mockAction)
      expect(result).toBe(builder)
      expect(builder.beginSequenceNode).not.toBeNull()
      expect(builder.beginSequenceNode?.action).toBe(mockAction)
    })

    it('should chain multiple actions', () => {
      const builder = new actions.SequenceBuilder()
      const mockAction1 = new MockAction()
      const mockAction2 = new MockAction()
      
      builder.then(mockAction1).then(mockAction2)
      
      expect(builder.beginSequenceNode).not.toBeNull()
      expect(builder.beginSequenceNode?.action).toBe(mockAction1)
      expect(builder.beginSequenceNode?.next?.action).toBe(mockAction2)
    })

    it('should add if sequence', () => {
      const builder = new actions.SequenceBuilder()
      const condition = () => true

      const result = builder.if(condition)
      expect(result).toBe(builder)
      // Note: IfSequenceNode is not exported, so we can't directly check instanceof
      expect(builder.beginSequenceNode).toBeDefined()
    })

    it('should add while sequence', () => {
      const builder = new actions.SequenceBuilder()
      const condition = () => true

      const result = builder.while(condition)
      expect(result).toBe(builder)
      // Note: WhileSequenceNode is not exported, so we can't directly check instanceof
      expect(builder.beginSequenceNode).toBeDefined()
    })

    it('should throw error when else is called without if', () => {
      const builder = new actions.SequenceBuilder()
      const mockAction = new MockAction()
      
      builder.then(mockAction) // This creates a regular sequence node
      
      expect(() => {
        builder.else()
      }).toThrow('IF statement is needed to be called before ELSE statement.')
    })

    it('should throw error when endIf is called without if', () => {
      const builder = new actions.SequenceBuilder()
      const mockAction = new MockAction()
      
      builder.then(mockAction) // This creates a regular sequence node
      
      expect(() => {
        builder.endIf()
      }).toThrow('IF statement is needed to be called before ENDIF statement.')
    })

    it('should throw error when endWhile is called without while', () => {
      const builder = new actions.SequenceBuilder()
      const mockAction = new MockAction()
      
      builder.then(mockAction) // This creates a regular sequence node
      
      expect(() => {
        builder.endWhile()
      }).toThrow('WHILE statement is needed to be called before ENDWHILE statement.')
    })

    it('should throw error when breakWhile is called without while', () => {
      const builder = new actions.SequenceBuilder()
      
      expect(() => {
        builder.breakWhile()
      }).toThrow('WHILE statement is needed to be called before BREAKWHILE statement.')
    })
  })

  // Skipping tests for internal classes IfSequenceNode, ElseSequenceNode, WhileSequenceNode,
  // and BreakWhileSequenceNode as they are not exported from the actions namespace

  describe('SequenceRunner', () => {
    let sequenceRunner: actions.SequenceRunner

    beforeEach(() => {
      jest.clearAllMocks()
      sequenceRunner = new actions.SequenceRunner(mockEngine)
    })

    afterEach(() => {
      sequenceRunner.destroy()
    })

    it('should initialize properly', () => {
      expect(mockEngine.addSystem).toHaveBeenCalled()
      expect(sequenceRunner.isRunning()).toBe(false)
    })

    it('should start a sequence', () => {
      const builder = new actions.SequenceBuilder()
      const mockAction = new MockAction()
      builder.then(mockAction)
      
      sequenceRunner.startSequence(builder)
      
      expect(sequenceRunner.isRunning()).toBe(true)
      expect(sequenceRunner['beginSequenceNode']).not.toBeNull()
    })

    it('should call onFinish callback when sequence completes', (done) => {
      const mockAction = new MockAction()
      mockAction.hasFinished = true // Make it finish immediately
      
      const builder = new actions.SequenceBuilder()
      builder.then(mockAction)
      
      const onFinishCallback = jest.fn(() => {
        expect(onFinishCallback).toHaveBeenCalled()
        done()
      })
      
      sequenceRunner = new actions.SequenceRunner(mockEngine, builder, onFinishCallback)
      sequenceRunner['update'](0.1) // Manually trigger update to complete sequence
      
      // Second update to trigger completion and callback
      sequenceRunner['update'](0.1)
    })

    it('should get running action', () => {
      const mockAction = new MockAction()
      const builder = new actions.SequenceBuilder()
      builder.then(mockAction)
      
      sequenceRunner.startSequence(builder)
      
      const runningAction = sequenceRunner.getRunningAction()
      expect(runningAction).toBe(mockAction)
    })

    it('should stop and resume properly', () => {
      expect(sequenceRunner.isRunning()).toBe(false)

      const builder = new actions.SequenceBuilder()
      const mockAction = new MockAction()
      builder.then(mockAction)

      sequenceRunner.startSequence(builder)
      expect(sequenceRunner.isRunning()).toBe(true)

      sequenceRunner.stop()
      expect(sequenceRunner.isRunning()).toBe(false)

      sequenceRunner.resume()
      expect(sequenceRunner.isRunning()).toBe(true)
    })

    it('should reset properly', () => {
      const mockAction = new MockAction()
      const builder = new actions.SequenceBuilder()
      builder.then(mockAction)
      
      sequenceRunner.startSequence(builder)
      sequenceRunner.stop()
      
      sequenceRunner.reset()
      expect(sequenceRunner.isRunning()).toBe(true)
      expect(sequenceRunner['started']).toBe(false)
    })

    it('should destroy properly', () => {
      sequenceRunner.destroy()
      expect(mockEngine.removeSystem).toHaveBeenCalled()
    })

    it('should handle sequence update cycle', () => {
      const mockAction = new MockAction()
      const builder = new actions.SequenceBuilder()
      builder.then(mockAction)
      
      sequenceRunner.startSequence(builder)
      
      // First update should call onStart
      sequenceRunner['update'](0.1)
      expect(mockAction.onStartCalled).toBe(true)
      expect(sequenceRunner['started']).toBe(true)
      
      // Second update should call update since action is not finished
      sequenceRunner['update'](0.1)
      expect(mockAction.updateCalled).toBe(true)
    })

    it('should handle sequence completion', () => {
      const mockAction = new MockAction()
      mockAction.hasFinished = true // Make it finish immediately
      
      const builder = new actions.SequenceBuilder()
      builder.then(mockAction)
      
      sequenceRunner.startSequence(builder)
      
      // First update calls onStart
      sequenceRunner['update'](0.1)
      expect(mockAction.onStartCalled).toBe(true)
      
      // Second update detects finish and calls onFinish
      sequenceRunner['update'](0.1)
      expect(mockAction.onFinishCalled).toBe(true)
      expect(sequenceRunner.isRunning()).toBe(false)
    })

    it('should handle setOnFinishCallback', () => {
      const callback = jest.fn()
      sequenceRunner.setOnFinishCallback(callback)
      expect((sequenceRunner as any).onFinishCallback).toBe(callback)
    })
  })

  // Skipping tests for internal class SubSequenceNode as it is not exported from the actions namespace
})