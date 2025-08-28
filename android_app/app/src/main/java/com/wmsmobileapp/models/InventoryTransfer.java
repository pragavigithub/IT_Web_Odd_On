package com.wmsmobileapp.models;

public class InventoryTransfer {
    private String transferNumber;
    private String status;
    private String fromWarehouse;
    private String toWarehouse;
    private String date;
    private String requestNumber;
    
    public InventoryTransfer() {}
    
    public InventoryTransfer(String transferNumber, String status, String fromWarehouse, String toWarehouse) {
        this.transferNumber = transferNumber;
        this.status = status;
        this.fromWarehouse = fromWarehouse;
        this.toWarehouse = toWarehouse;
    }
    
    // Getters and Setters
    public String getTransferNumber() { return transferNumber; }
    public void setTransferNumber(String transferNumber) { this.transferNumber = transferNumber; }
    
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    
    public String getFromWarehouse() { return fromWarehouse; }
    public void setFromWarehouse(String fromWarehouse) { this.fromWarehouse = fromWarehouse; }
    
    public String getToWarehouse() { return toWarehouse; }
    public void setToWarehouse(String toWarehouse) { this.toWarehouse = toWarehouse; }
    
    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }
    
    public String getRequestNumber() { return requestNumber; }
    public void setRequestNumber(String requestNumber) { this.requestNumber = requestNumber; }
}