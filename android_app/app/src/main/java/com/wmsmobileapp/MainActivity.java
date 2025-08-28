package com.wmsmobileapp;

import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import com.google.android.material.floatingactionbutton.FloatingActionButton;
import com.google.android.material.bottomnavigation.BottomNavigationView;

/**
 * Main Activity for Warehouse Management System
 * Handles navigation between GRPO, Inventory Transfer, and Pick List modules
 */
public class MainActivity extends AppCompatActivity {
    
    private BottomNavigationView bottomNavigation;
    private TextView titleText;
    private RecyclerView mainRecyclerView;
    private FloatingActionButton fabAdd;
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        
        initializeViews();
        setupBottomNavigation();
        setupRecyclerView();
        setupFAB();
        
        // Set default fragment to GRPO
        loadGRPOModule();
    }
    
    private void initializeViews() {
        bottomNavigation = findViewById(R.id.bottom_navigation);
        titleText = findViewById(R.id.title_text);
        mainRecyclerView = findViewById(R.id.main_recycler_view);
        fabAdd = findViewById(R.id.fab_add);
    }
    
    private void setupBottomNavigation() {
        bottomNavigation.setOnItemSelectedListener(item -> {
            int itemId = item.getItemId();
            if (itemId == R.id.nav_grpo) {
                loadGRPOModule();
                return true;
            } else if (itemId == R.id.nav_inventory_transfer) {
                loadInventoryTransferModule();
                return true;
            } else if (itemId == R.id.nav_pick_list) {
                loadPickListModule();
                return true;
            } else if (itemId == R.id.nav_settings) {
                loadSettingsModule();
                return true;
            }
            return false;
        });
    }
    
    private void setupRecyclerView() {
        mainRecyclerView.setLayoutManager(new LinearLayoutManager(this));
    }
    
    private void setupFAB() {
        fabAdd.setOnClickListener(v -> {
            // Handle add action based on current module
            int selectedItemId = bottomNavigation.getSelectedItemId();
            if (selectedItemId == R.id.nav_grpo) {
                createNewGRPO();
            } else if (selectedItemId == R.id.nav_inventory_transfer) {
                createNewInventoryTransfer();
            } else if (selectedItemId == R.id.nav_pick_list) {
                createNewPickList();
            }
        });
    }
    
    private void loadGRPOModule() {
        titleText.setText("GRPO Documents");
        // Load GRPO adapter
        GRPOAdapter adapter = new GRPOAdapter();
        mainRecyclerView.setAdapter(adapter);
        fabAdd.show();
    }
    
    private void loadInventoryTransferModule() {
        titleText.setText("Inventory Transfers");
        // Load Inventory Transfer adapter
        InventoryTransferAdapter adapter = new InventoryTransferAdapter();
        mainRecyclerView.setAdapter(adapter);
        fabAdd.show();
    }
    
    private void loadPickListModule() {
        titleText.setText("Pick Lists");
        // Load Pick List adapter
        PickListAdapter adapter = new PickListAdapter();
        mainRecyclerView.setAdapter(adapter);
        fabAdd.show();
    }
    
    private void loadSettingsModule() {
        titleText.setText("Settings");
        // Load Settings adapter
        SettingsAdapter adapter = new SettingsAdapter();
        mainRecyclerView.setAdapter(adapter);
        fabAdd.hide();
    }
    
    private void createNewGRPO() {
        Toast.makeText(this, "Creating new GRPO...", Toast.LENGTH_SHORT).show();
        // TODO: Start GRPO creation activity
    }
    
    private void createNewInventoryTransfer() {
        Toast.makeText(this, "Creating new Inventory Transfer...", Toast.LENGTH_SHORT).show();
        // TODO: Start Inventory Transfer creation activity
    }
    
    private void createNewPickList() {
        Toast.makeText(this, "Creating new Pick List...", Toast.LENGTH_SHORT).show();
        // TODO: Start Pick List creation activity
    }
}