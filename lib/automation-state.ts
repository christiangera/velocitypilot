class AutomationStateManager {
  private currentService: any = null
  private stopRequested = false

  setCurrentService(service: any) {
    this.currentService = service
    this.stopRequested = false
  }

  requestStop() {
    console.log("🛑 Stop requested via state manager")
    this.stopRequested = true
    if (this.currentService) {
      this.currentService.requestStop()
    }
  }

  clearService() {
    this.currentService = null
    this.stopRequested = false
  }

  isStopRequested(): boolean {
    return this.stopRequested
  }

  hasActiveService(): boolean {
    return this.currentService !== null
  }
}

// Export singleton instance
export const automationStateManager = new AutomationStateManager()
