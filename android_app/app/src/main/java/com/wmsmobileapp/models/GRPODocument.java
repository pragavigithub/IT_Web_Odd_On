package com.wmsmobileapp.models;

/**
 * Model class for GRPO (Goods Receipt against Purchase Order) Document
 */
public class GRPODocument {
    private String grpoNumber;
    private String poNumber;
    private String status;
    private String date;
    private String warehouse;
    private String vendor;
    private double totalAmount;
    
    public GRPODocument() {
        // Default constructor
    }
    
    public GRPODocument(String grpoNumber, String poNumber, String status, String date) {
        this.grpoNumber = grpoNumber;
        this.poNumber = poNumber;
        this.status = status;
        this.date = date;
    }
    
    // Getters and Setters
    public String getGrpoNumber() {
        return grpoNumber;
    }
    
    public void setGrpoNumber(String grpoNumber) {
        this.grpoNumber = grpoNumber;
    }
    
    public String getPoNumber() {
        return poNumber;
    }
    
    public void setPoNumber(String poNumber) {
        this.poNumber = poNumber;
    }
    
    public String getStatus() {
        return status;
    }
    
    public void setStatus(String status) {
        this.status = status;
    }
    
    public String getDate() {
        return date;
    }
    
    public void setDate(String date) {
        this.date = date;
    }
    
    public String getWarehouse() {
        return warehouse;
    }
    
    public void setWarehouse(String warehouse) {
        this.warehouse = warehouse;
    }
    
    public String getVendor() {
        return vendor;
    }
    
    public void setVendor(String vendor) {
        this.vendor = vendor;
    }
    
    public double getTotalAmount() {
        return totalAmount;
    }
    
    public void setTotalAmount(double totalAmount) {
        this.totalAmount = totalAmount;
    }
}