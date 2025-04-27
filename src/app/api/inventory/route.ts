import { NextRequest, NextResponse } from 'next/server';
import { bloodInventoryAPI } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const bloodGroup = url.searchParams.get('bloodGroup');
    const hospitalId = url.searchParams.get('hospitalId');
    const centerId = url.searchParams.get('centerId');
    const compatibleOnly = url.searchParams.get('compatible') === 'true';
    
    let inventoryData;
    
    if (compatibleOnly && bloodGroup) {
      // Use the RPC function to get compatible blood
      inventoryData = await bloodInventoryAPI.getCompatibleBloodInventory(bloodGroup);
    } else if (bloodGroup) {
      // Get inventory with the exact blood group
      inventoryData = await bloodInventoryAPI.getInventoryByBloodGroup(bloodGroup);
    } else if (hospitalId) {
      // Get inventory for a specific hospital
      inventoryData = await bloodInventoryAPI.getInventoryByHospital(hospitalId);
    } else if (centerId) {
      // Get inventory for a specific blood center
      inventoryData = await bloodInventoryAPI.getInventoryByCenter(centerId);
    } else {
      // Get all inventory
      inventoryData = await bloodInventoryAPI.getAllInventory();
    }
    
    return NextResponse.json({ 
      success: true, 
      inventory: inventoryData 
    });
  } catch (error) {
    console.error('Error fetching blood inventory:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch blood inventory'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json();
    const { blood_grp, quantity, status, hospital_id, center_id, doc_id } = requestData;
    
    // Validate required fields
    if (!blood_grp || !quantity || !status || !(hospital_id || center_id)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields'
        },
        { status: 400 }
      );
    }
    
    // Ensure only one location (hospital or center) is specified
    if (hospital_id && center_id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Only one of hospital_id or center_id can be specified'
        },
        { status: 400 }
      );
    }
    
    // Add the inventory item
    const result = await bloodInventoryAPI.addInventoryItem({
      blood_grp,
      quantity,
      status,
      hospital_id,
      center_id,
      doc_id
    });
    
    return NextResponse.json({ 
      success: true, 
      inventory: result 
    });
  } catch (error) {
    console.error('Error adding blood inventory:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to add blood inventory'
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const requestData = await request.json();
    const { inventory_id, ...updateData } = requestData;
    
    if (!inventory_id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing inventory_id'
        },
        { status: 400 }
      );
    }
    
    // Update the inventory item
    const result = await bloodInventoryAPI.updateInventoryItem(inventory_id, updateData);
    
    return NextResponse.json({ 
      success: true, 
      inventory: result 
    });
  } catch (error) {
    console.error('Error updating blood inventory:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update blood inventory'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const inventoryId = url.searchParams.get('id');
    
    if (!inventoryId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing inventory id'
        },
        { status: 400 }
      );
    }
    
    // Delete the inventory item
    await bloodInventoryAPI.deleteInventoryItem(inventoryId);
    
    return NextResponse.json({ 
      success: true
    });
  } catch (error) {
    console.error('Error deleting blood inventory:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete blood inventory'
      },
      { status: 500 }
    );
  }
} 