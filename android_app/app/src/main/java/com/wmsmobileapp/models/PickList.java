package com.wmsmobileapp.models;

public class PickList {
    private String pickListNumber;
    private String status;
    private String salesOrderNumber;
    private String priority;
    private String date;
    private String warehouse;
    
    public PickList() {}
    
    public PickList(String pickListNumber, String status, String salesOrderNumber, String priority) {
        this.pickListNumber = pickListNumber;
        this.status = status;
        this.salesOrderNumber = salesOrderNumber;
        this.priority = priority;
    }
    
    // Getters and Setters
    public String getPickListNumber() { return pickListNumber; }
    public void setPickListNumber(String pickListNumber) { this.pickListNumber = pickListNumber; }
    
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    
    public String getSalesOrderNumber() { return salesOrderNumber; }
    public void setSalesOrderNumber(String salesOrderNumber) { this.salesOrderNumber = salesOrderNumber; }
    
    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }
    
    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }
    
    public String getWarehouse() { return warehouse; }
    public void setWarehouse(String warehouse) { this.warehouse = warehouse; }
}